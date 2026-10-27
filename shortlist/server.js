import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Store, STATUSES, newId } from './lib/store.js';
import { SponsorRegister } from './lib/sponsors.js';
import { reed, adzuna, searchAll } from './lib/sources.js';
import { formatSalary, ukFlags } from './lib/salary.js';
import { createProvider, analyse, tailor, importProfile } from './lib/ai.js';
import { readUpload, mergeProfile, linkedinUrl, MAX_UPLOAD_BYTES } from './lib/cv-import.js';
import { PRIVATE_FIELDS, withoutPrivate, placeholder, redact } from './lib/privacy.js';
import { assemble, cvHtml, letterHtml } from './lib/documents.js';

try { process.loadEnvFile(); } catch {}

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA = process.env.SHORTLIST_DATA || path.join(ROOT, 'data');
const PUBLIC = path.join(ROOT, 'public');
const env = process.env;

await fs.mkdir(DATA, { recursive: true });
const store = new Store(DATA);
await store.load();
await scrubContactDetails();
const sponsors = new SponsorRegister(DATA);
sponsors.load().catch((err) => console.warn(err.message));
setInterval(() => sponsors.load().catch((err) => console.warn(err.message)), 6 * 60 * 60 * 1000).unref();

const provider = createProvider(env);
const sources = [
  env.REED_API_KEY && reed({ apiKey: env.REED_API_KEY }),
  env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY && adzuna({ appId: env.ADZUNA_APP_ID, appKey: env.ADZUNA_APP_KEY }),
].filter(Boolean);

// --- Sign-in: one password, sessions held in memory. ---
const PASSWORD = env.SHORTLIST_PASSWORD || '';
const sessions = new Set();
const failures = new Map();
const cookieToken = (req) => /(?:^|;\s*)shortlist=([a-f0-9]{64})/.exec(req.headers.cookie || '')?.[1];
const signedIn = (req) => !PASSWORD || sessions.has(cookieToken(req));
const samePassword = (given) => {
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
};

// --- Helpers ---
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  res.writeHead(status, { 'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(isJson ? JSON.stringify(body) : body);
}

async function readJson(req, limit = 2_000_000) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, 'That is too large.');
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'The request was not valid JSON.'); }
}

const needAi = () => { if (!provider) throw new HttpError(400, 'No AI model is set up. Set ANTHROPIC_API_KEY, or AI_PROVIDER=ollama with OLLAMA_MODEL, and restart.'); };

/** Adds what the UI shows next to a posting: £ salary, UK flags, the sponsor register check. */
function decorate(p) {
  const sponsor = sponsors.lookup(p.employer);
  return {
    ...p,
    salaryText: formatSalary(p.salaryMin, p.salaryMax, { predicted: p.salaryPredicted }),
    flags: ukFlags(`${p.title} ${p.description}`),
    sponsor: sponsor && sponsor.match !== 'none' ? sponsor : null,
    saved: store.data.saved.some((s) => s.id === p.id),
    applied: store.data.applications.some((a) => a.posting?.id === p.id),
  };
}

function postingText(p) {
  return [
    `Job title: ${p.title || ''}`, `Employer: ${p.employer || ''}`, `Location: ${p.location || ''}`,
    p.salaryText ? `Salary: ${p.salaryText}` : '', p.contract ? `Contract: ${p.contract}` : '', p.closes ? `Closing date: ${p.closes}` : '',
    '', p.description || '',
  ].filter((l, i) => l !== '' || i === 6).join('\n');
}

const touch = (app, what) => { app.updatedAt = new Date().toISOString(); app.history.push({ at: app.updatedAt, what }); };

// --- Routes ---
const routes = [];
const route = (method, pattern, handler, { open = false } = {}) => routes.push({ method, pattern, handler, open });

route('POST', /^\/api\/login$/, async (req, res) => {
  const ip = req.socket.remoteAddress;
  const f = failures.get(ip) || { count: 0, until: 0 };
  if (Date.now() < f.until) throw new HttpError(429, 'Too many tries. Wait a minute.');
  const { password } = await readJson(req);
  if (!PASSWORD || samePassword(password)) {
    failures.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.add(token);
    return send(res, 200, { ok: true }, { 'Set-Cookie': `shortlist=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000` });
  }
  f.count++;
  if (f.count >= 5) { f.until = Date.now() + 60_000; f.count = 0; }
  failures.set(ip, f);
  throw new HttpError(401, 'Wrong password.');
}, { open: true });

route('POST', /^\/api\/logout$/, async (req, res) => {
  sessions.delete(cookieToken(req));
  send(res, 200, { ok: true }, { 'Set-Cookie': 'shortlist=; Path=/; Max-Age=0' });
});

route('GET', /^\/api\/status$/, async (req, res) => send(res, 200, {
  signedIn: signedIn(req),
  needsPassword: !!PASSWORD,
  ai: provider?.label || null,
  sources: sources.map((s) => s.name),
  sponsors: sponsors.meta ? { file: sponsors.meta.publishedName, organisations: sponsors.meta.organisations } : null,
  statuses: STATUSES,
}), { open: true });

// Profiles saved before contact details moved to the browser still hold them. They're handed to the
// page once (as legacyContact), which keeps them and saves the profile, removing them here.
route('GET', /^\/api\/profile$/, async (req, res) => {
  const legacy = Object.fromEntries(PRIVATE_FIELDS.filter((f) => store.data.profile[f]).map((f) => [f, store.data.profile[f]]));
  send(res, 200, { ...withoutPrivate(store.data.profile), ...(Object.keys(legacy).length ? { legacyContact: legacy } : {}) });
});
route('PUT', /^\/api\/profile$/, async (req, res) => {
  const { legacyContact, ...profile } = withoutPrivate(await readJson(req));
  for (const key of ['experience', 'education', 'certifications', 'projects']) {
    if (profile[key]) profile[key] = profile[key].map((e) => ({ ...e, id: e.id || newId() }));
  }
  await store.update((d) => { d.profile = withoutPrivate({ ...d.profile, ...profile }); });
  send(res, 200, store.data.profile);
});

// Reads a CV into the profile. Its email, phone number and address are taken out of the text first:
// they go back to the page (which keeps them in the browser) and never to the AI or the disk.
// Nothing is saved: the merged profile goes
// back to the page to be checked, and saved like any other edit.
route('POST', /^\/api\/profile\/import$/, async (req, res) => {
  const { files = [], linkedin } = await readJson(req, 2 * MAX_UPLOAD_BYTES);
  let link;
  try { link = linkedinUrl(linkedin); } catch (err) { throw new HttpError(400, err.message); }
  if (!files.length && !link) throw new HttpError(400, 'Choose your CV, or add your LinkedIn address.');
  if (files.length > 1) throw new HttpError(400, 'One CV at a time.');
  const documents = [];
  for (const f of files) {
    try { documents.push(await readUpload(String(f.name || 'file'), Buffer.from(String(f.data || ''), 'base64'))); }
    catch (err) { throw new HttpError(400, err.message); }
  }
  let found = { linkedin: link };
  const contact = {};
  for (const d of documents) {
    const { text, found: details } = redact(d.text);
    d.text = text;
    for (const [k, v] of Object.entries(details)) contact[k] ??= v;
  }
  if (documents.length) {
    needAi();
    found = await ai(() => importProfile(provider, documents, link));
    if (link) found.linkedin = link;
  }
  send(res, 200, { ...mergeProfile(withoutPrivate(store.data.profile), found), contact, read: documents.map((d) => d.name) });
});

route('GET', /^\/api\/jobs$/, async (req, res, url) => {
  if (!sources.length) throw new HttpError(400, 'No job board is set up. Add REED_API_KEY and/or ADZUNA_APP_ID and ADZUNA_APP_KEY, then restart.');
  const q = url.searchParams;
  const keywords = (q.get('keywords') || '').trim();
  if (!keywords) throw new HttpError(400, 'Say what kind of job to look for.');
  await sponsors.load().catch(() => {});
  const { postings, errors } = await searchAll(sources, {
    keywords, location: q.get('location') || store.data.profile.town, miles: Number(q.get('miles')) || 10,
    minSalary: Number(q.get('minSalary')) || undefined, sort: q.get('sort'),
  });
  const dismissed = new Set(store.data.dismissed);
  let out = postings.filter((p) => !dismissed.has(p.id)).map(decorate);
  if (q.get('sponsorsOnly') === '1') out = out.filter((p) => p.sponsor?.match === 'exact' && !p.flags.includes('Says no sponsorship'));
  send(res, 200, { postings: out, errors });
});

route('GET', /^\/api\/jobs\/saved$/, async (req, res) => send(res, 200, store.data.saved.map(decorate)));
route('POST', /^\/api\/jobs\/save$/, async (req, res) => {
  const { posting } = await readJson(req);
  if (!posting?.id) throw new HttpError(400, 'Which posting?');
  await store.update((d) => { if (!d.saved.some((s) => s.id === posting.id)) d.saved.unshift(strip(posting)); });
  send(res, 200, { ok: true });
});
route('POST', /^\/api\/jobs\/unsave$/, async (req, res) => {
  const { id } = await readJson(req);
  await store.update((d) => { d.saved = d.saved.filter((s) => s.id !== id); });
  send(res, 200, { ok: true });
});
route('POST', /^\/api\/jobs\/dismiss$/, async (req, res) => {
  const { id } = await readJson(req);
  await store.update((d) => { d.saved = d.saved.filter((s) => s.id !== id); if (!d.dismissed.includes(id)) d.dismissed.push(id); });
  send(res, 200, { ok: true });
});

route('GET', /^\/api\/sponsors$/, async (req, res, url) => {
  await sponsors.load();
  const q = url.searchParams.get('q') || '';
  send(res, 200, { meta: { file: sponsors.meta.publishedName, organisations: sponsors.meta.organisations }, results: sponsors.search(q) });
});

route('GET', /^\/api\/applications$/, async (req, res) => send(res, 200, store.data.applications.map(summary)));

route('POST', /^\/api\/applications$/, async (req, res) => {
  const { posting, pasted } = await readJson(req);
  let p;
  if (posting?.id) {
    p = strip(posting);
    const source = sources.find((s) => s.name === posting.source);
    const full = await source?.details(posting.sourceId).catch(() => null);
    if (full) p = { ...p, ...full };
  } else if (pasted?.trim()) {
    p = { id: `pasted:${newId()}`, source: 'Pasted', title: '', employer: '', location: '', description: pasted.trim(), descriptionIsFull: true };
  } else throw new HttpError(400, 'Paste a job posting, or pick one from Find jobs.');
  const app = { id: newId(), status: 'Drafting', posting: p, analysis: null, documents: null, notes: '', createdAt: new Date().toISOString(), history: [] };
  touch(app, 'Created');
  await store.update((d) => { d.applications.unshift(app); d.saved = d.saved.filter((s) => s.id !== p.id); });
  send(res, 201, view(app));
});

route('GET', /^\/api\/applications\/([\w-]+)$/, async (req, res, url, [id]) => send(res, 200, view(mustApp(id))));

route('PATCH', /^\/api\/applications\/([\w-]+)$/, async (req, res, url, [id]) => {
  const body = await readJson(req);
  const app = mustApp(id);
  await store.update(() => {
    if (body.status && body.status !== app.status) {
      if (!STATUSES.includes(body.status)) throw new HttpError(400, 'Unknown status.');
      touch(app, `Moved to ${body.status}`);
      app.status = body.status;
      if (body.status === 'Applied' && !app.appliedAt) app.appliedAt = app.updatedAt;
    }
    if (typeof body.notes === 'string') { app.notes = body.notes; app.updatedAt = new Date().toISOString(); }
    if (typeof body.description === 'string') { app.posting.description = body.description; app.posting.descriptionIsFull = true; touch(app, 'Edited the posting'); }
    if (body.documents && app.documents) { app.documents = { ...app.documents, ...pickDocs(body.documents) }; touch(app, 'Edited the documents'); }
  });
  send(res, 200, view(app));
});

route('DELETE', /^\/api\/applications\/([\w-]+)$/, async (req, res, url, [id]) => {
  await store.update((d) => { d.applications = d.applications.filter((a) => a.id !== id); });
  send(res, 200, { ok: true });
});

// AI failures are the model's or the network's, not the server's: report them plainly.
const ai = (fn) => fn().catch((err) => { throw err instanceof HttpError ? err : new HttpError(502, err.message); });

async function runAnalysis(app) {
  const analysis = await ai(() => analyse(provider, store.data.profile, postingText(decorate(app.posting))));
  await store.update(() => {
    app.analysis = analysis;
    // A pasted posting has no fields until the AI reads them out.
    for (const k of ['title', 'employer', 'location']) if (!app.posting[k] && analysis[k]) app.posting[k] = analysis[k];
    touch(app, `Matched against your profile: ${Math.round(analysis.score)}%`);
  });
}

route('POST', /^\/api\/applications\/([\w-]+)\/analyse$/, async (req, res, url, [id]) => {
  needAi();
  const app = mustApp(id);
  await runAnalysis(app);
  send(res, 200, view(app));
});

route('POST', /^\/api\/applications\/([\w-]+)\/tailor$/, async (req, res, url, [id]) => {
  needAi();
  const { tone, instruction } = await readJson(req);
  const app = mustApp(id);
  const profile = store.data.profile;
  if (!profile.name || !(profile.experience || []).length) throw new HttpError(400, 'Fill in your profile first: at least your name and one job.');
  if (!app.analysis) await runAnalysis(app);
  const draft = await ai(() => tailor(provider, profile, postingText(decorate(app.posting)), app.analysis, { tone, instruction }));
  const docs = assemble(profile, app.analysis, draft);
  await store.update(() => {
    if (app.documents) (app.versions ||= []).push({ at: app.updatedAt, documents: app.documents });
    app.documents = { ...docs, tone: tone || 'professional' };
    touch(app, instruction ? `Rewrote the documents: "${instruction}"` : 'Wrote a tailored CV, cover letter and email');
  });
  send(res, 200, view(app));
});

route('POST', /^\/api\/applications\/([\w-]+)\/undo$/, async (req, res, url, [id]) => {
  const app = mustApp(id);
  if (!app.versions?.length) throw new HttpError(400, 'There is no earlier version.');
  await store.update(() => { app.documents = app.versions.pop().documents; touch(app, 'Went back to the previous version'); });
  send(res, 200, view(app));
});

route('GET', /^\/print\/([\w-]+)\/(cv|letter)$/, async (req, res, url, [id, kind]) => {
  const app = mustApp(id);
  if (!app.documents) throw new HttpError(404, 'Nothing written yet.');
  send(res, 200, kind === 'cv' ? cvHtml(app.documents.cv) : letterHtml(app.documents.coverLetter));
});

route('GET', /^\/api\/export$/, async (req, res) =>
  send(res, 200, { ...store.data, profile: withoutPrivate(store.data.profile) }, { 'Content-Disposition': `attachment; filename="shortlist-${new Date().toISOString().slice(0, 10)}.json"` }));

route('POST', /^\/api\/import$/, async (req, res) => {
  const data = await readJson(req);
  if (!data.profile || !Array.isArray(data.applications)) throw new HttpError(400, 'That is not a Shortlist export.');
  await store.update((d) => Object.assign(d, { saved: [], dismissed: [], ...data, profile: withoutPrivate(data.profile) }));
  await scrubContactDetails(data.profile);
  send(res, 200, { ok: true });
});

/**
 * Documents written before contact details moved to the browser have them in plain text. Swap each
 * one (from the profile, or `from`) for its placeholder, so the page fills it in from the browser.
 */
async function scrubContactDetails(from = store.data.profile) {
  const swaps = ['email', 'phone'].filter((f) => from?.[f]).map((f) => [String(from[f]), placeholder(f)]);
  if (!swaps.length) return;
  const scrub = (v) => typeof v === 'string' ? swaps.reduce((s, [a, b]) => s.split(a).join(b), v)
    : Array.isArray(v) ? v.map(scrub) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrub(x)])) : v;
  await store.update((d) => {
    for (const app of d.applications) {
      if (app.documents) app.documents = scrub(app.documents);
      if (app.versions) app.versions = scrub(app.versions);
    }
  });
}

function mustApp(id) {
  const app = store.application(id);
  if (!app) throw new HttpError(404, 'No such application.');
  return app;
}
function strip(p) {
  const { saved, applied, sponsor, flags, salaryText, ...rest } = p;
  return rest;
}
function pickDocs(d) {
  const out = {};
  if (d.cv) out.cv = d.cv;
  if (d.coverLetter) out.coverLetter = d.coverLetter;
  if (d.email) out.email = d.email;
  return out;
}
const view = (app) => ({ ...app, posting: decorate(app.posting), hasVersions: !!app.versions?.length, versions: undefined });
const summary = (app) => {
  const p = decorate(app.posting);
  return {
    id: app.id, status: app.status, title: p.title || app.analysis?.title || 'Untitled posting', employer: p.employer || app.analysis?.employer || '',
    location: p.location, salaryText: p.salaryText, sponsor: p.sponsor, score: app.analysis?.score ?? null, hasDocuments: !!app.documents,
    createdAt: app.createdAt, updatedAt: app.updatedAt, appliedAt: app.appliedAt || null, closes: p.closes || null,
  };
};

// --- Static files ---
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
async function serveStatic(res, pathname) {
  const file = path.join(PUBLIC, pathname === '/' ? 'index.html' : path.normalize(pathname));
  if (!file.startsWith(PUBLIC)) return send(res, 404, { error: 'Not found' });
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { send(res, 404, { error: 'Not found' }); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  try {
    // Cross-site requests can't change anything: browsers send Origin on POST/PUT/PATCH/DELETE.
    if (req.method !== 'GET' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw new HttpError(403, 'Cross-site request refused.');
    for (const r of routes) {
      const m = r.method === req.method && r.pattern.exec(url.pathname);
      if (!m) continue;
      if (!r.open && !signedIn(req)) throw new HttpError(401, 'Sign in first.');
      return await r.handler(req, res, url, m.slice(1));
    }
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) return await serveStatic(res, url.pathname);
    throw new HttpError(404, 'Not found');
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error(err);
    const message = err instanceof HttpError ? err.message : `Something went wrong: ${err.message}`;
    if (url.pathname.startsWith('/print/')) return send(res, status, `<p>${message.replace(/</g, '&lt;')}</p>`);
    send(res, status, { error: message });
  }
});
server.requestTimeout = 10 * 60 * 1000; // writing documents can take a few minutes on a local model

const port = Number(env.PORT) || 3000;
const host = env.HOST || '127.0.0.1';
server.listen(port, host, () => {
  console.log(`Shortlist is running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  console.log(`  AI: ${provider?.label || 'not set up'}   Job boards: ${sources.map((s) => s.name).join(', ') || 'none set up'}`);
  if (!PASSWORD && host !== '127.0.0.1' && host !== 'localhost') console.warn('  Warning: listening beyond this computer without SHORTLIST_PASSWORD.');
});
