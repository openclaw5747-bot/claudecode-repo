// Builds the CV, cover letter and email from the profile plus the AI's draft. Facts (names,
// employers, titles, dates, qualifications) always come from the profile; the AI only supplies
// wording. Anything the AI wrote that can't be traced back to the profile is reported.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonth(ym) {
  const m = /^(\d{4})-(\d{2})/.exec(ym || '');
  if (!m) return ym || '';
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export const dateRange = (start, end) => [formatMonth(start), end ? formatMonth(end) : 'Present'].filter(Boolean).join(' – ');

/** "27 October 2026", the British way. */
export const longDate = (d = new Date()) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const norm = (s) => String(s || '').toLowerCase().trim();

// Figures (numbers, percentages, money) the AI used; each must appear somewhere in the profile.
const FIGURE = /£?\d[\d,]*(?:\.\d+)?(?:\s?(?:%|k\b|m\b|bn\b|million\b|billion\b|thousand\b))?/gi;
const figureKey = (f) => f.toLowerCase().replace(/[£,\s]/g, '');

export function unverifiedFigures(texts, profile) {
  const haystack = JSON.stringify(profile).toLowerCase().replace(/,/g, '');
  const out = [];
  for (const [where, text] of texts) {
    for (const f of String(text).match(FIGURE) || []) {
      const key = figureKey(f);
      if (/^(19|20)\d\d$/.test(key)) continue; // years are checked against the profile's dates anyway
      if (key.length < 2 && !/[%£km]/i.test(f)) continue; // "1 of 3"-style small numbers are rarely claims
      if (!haystack.includes(key.replace(/k$/, '000')) && !haystack.includes(key)) out.push({ figure: f.trim(), where });
    }
  }
  return out;
}

/** Joins the AI draft to the profile. Returns the documents plus a list of what was checked. */
export function assemble(profile, analysis, draft, { now = new Date() } = {}) {
  const issues = [];
  const profileSkills = new Map([...(profile.skills || []), ...(profile.languages || [])].map((s) => [norm(s), s]));
  const keySkills = [];
  for (const s of draft.keySkills || []) {
    const found = profileSkills.get(norm(s));
    if (found) { if (!keySkills.includes(found)) keySkills.push(found); }
    else issues.push(`Left out the skill "${s}": it isn't in your profile.`);
  }

  const byId = new Map((profile.experience || []).map((e) => [e.id, e]));
  const used = new Set();
  const experience = [];
  for (const e of draft.experience || []) {
    const entry = byId.get(e.id);
    if (!entry) { issues.push('Left out an experience entry the AI made up.'); continue; }
    used.add(e.id);
    experience.push({ ...pick(entry), bullets: e.bullets.filter(Boolean) });
  }
  // Every role stays on a UK CV (gaps raise questions); roles the AI skipped keep their own bullets.
  for (const entry of profile.experience || []) {
    if (!used.has(entry.id)) experience.push({ ...pick(entry), bullets: (entry.achievements || []).slice(0, 2) });
  }
  experience.sort((a, b) => (b.end || '9999').localeCompare(a.end || '9999') || (b.start || '').localeCompare(a.start || ''));

  const projectsById = new Map((profile.projects || []).map((p) => [p.id, p]));
  const projects = (draft.projectIds || []).map((id) => projectsById.get(id)).filter(Boolean);

  const cv = {
    name: profile.name, headline: profile.headline,
    contact: [profile.town, profile.phone, profile.email, profile.linkedin, profile.website].filter(Boolean),
    statement: draft.personalStatement,
    keySkills, experience, projects,
    education: profile.education || [], certifications: profile.certifications || [],
    languages: profile.languages || [],
    extras: [profile.drivingLicence ? 'Full UK driving licence' : null, profile.clearance ? `Security clearance: ${profile.clearance}` : null, profile.rightToWork ? `Right to work: ${profile.rightToWork}` : null].filter(Boolean),
    references: profile.references || 'Available on request',
  };

  // UK letter convention: a named recipient gets "Yours sincerely", "Dear Hiring Manager" gets "Yours faithfully".
  const contact = (analysis.contactName || '').trim();
  const coverLetter = {
    sender: [profile.name, profile.town, profile.phone, profile.email].filter(Boolean),
    date: longDate(now),
    recipient: [contact, analysis.employer, analysis.location].filter(Boolean),
    greeting: `Dear ${contact || 'Hiring Manager'},`,
    paragraphs: draft.coverLetter.paragraphs,
    signOff: contact ? 'Yours sincerely,' : 'Yours faithfully,',
    name: profile.name,
  };

  const email = {
    to: analysis.contactEmail || '',
    subject: draft.email.subject,
    body: `${draft.email.body.trim()}\n\nKind regards,\n${[profile.name, profile.phone].filter(Boolean).join('\n')}`,
  };

  const figures = unverifiedFigures([
    ['personal statement', draft.personalStatement],
    ...experience.flatMap((e) => e.bullets.map((b) => [`${e.title} bullets`, b])),
    ...draft.coverLetter.paragraphs.map((p) => ['cover letter', p]),
    ['email', draft.email.body],
  ], profile);
  for (const f of figures) issues.push(`Check "${f.figure}" in the ${f.where}: that figure isn't in your profile.`);

  return { cv, coverLetter, email, gaps: draft.gaps || [], issues };
}

function pick(e) {
  return { id: e.id, title: e.title, employer: e.employer, location: e.location, start: e.start, end: e.end, dates: dateRange(e.start, e.end) };
}

// --- Printable HTML (A4). The browser's "Save as PDF" makes the file. ---

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const PRINT_CSS = `
@page { size: A4; margin: 16mm 17mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.42 "Source Sans 3", "Segoe UI", Helvetica, Arial, sans-serif; color: #1d1d1b; margin: 0; background: #e9e7e1; }
.page { background: #fff; width: 210mm; min-height: 297mm; margin: 12px auto; padding: 16mm 17mm; box-shadow: 0 1px 6px rgba(0,0,0,.15); }
@media print { body { background: #fff; } .page { margin: 0; padding: 0; box-shadow: none; width: auto; min-height: 0; } .toolbar { display: none; } }
h1 { font-size: 21pt; margin: 0; letter-spacing: -.01em; }
.headline { color: #50504c; margin: 2px 0 6px; font-size: 11.5pt; }
.contact { color: #50504c; font-size: 9.5pt; }
.contact span + span::before { content: " · "; }
h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: .08em; color: #1f4e79; border-bottom: 1px solid #c9d4df; padding-bottom: 2px; margin: 14px 0 6px; }
.role { margin-bottom: 8px; break-inside: avoid; }
.role-head { display: flex; justify-content: space-between; gap: 12px; }
.role-head b { font-weight: 600; }
.muted { color: #5f5f5a; }
ul { margin: 3px 0 0; padding-left: 16px; }
li { margin: 1px 0; }
.skills { display: flex; flex-wrap: wrap; gap: 4px 14px; }
.letter p { margin: 0 0 10px; }
.letter .sender { text-align: right; margin-bottom: 18px; }
.letter .recipient { margin: 0 0 18px; }
.toolbar { text-align: center; font: 14px system-ui, sans-serif; padding: 10px; }
.toolbar button { font: inherit; padding: 6px 14px; cursor: pointer; }
`;

const shell = (title, body) => `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head>
<body><div class="toolbar"><button onclick="print()">Print or save as PDF</button></div><div class="page">${body}</div></body></html>`;

export function cvHtml(cv) {
  const lines = (arr) => arr.map((l) => `<span>${esc(l)}</span>`).join('');
  const section = (title, html) => (html ? `<h2>${title}</h2>${html}` : '');
  return shell(`${cv.name} – CV`, `
<h1>${esc(cv.name)}</h1>${cv.headline ? `<div class="headline">${esc(cv.headline)}</div>` : ''}
<div class="contact">${lines(cv.contact)}</div>
${section('Personal statement', cv.statement ? `<p>${esc(cv.statement)}</p>` : '')}
${section('Key skills', cv.keySkills.length ? `<div class="skills">${cv.keySkills.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '')}
${section('Employment history', cv.experience.map((e) => `<div class="role"><div class="role-head"><div><b>${esc(e.title)}</b>, ${esc(e.employer)}${e.location ? `, <span class="muted">${esc(e.location)}</span>` : ''}</div><div class="muted">${esc(e.dates)}</div></div>${e.bullets.length ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>`).join(''))}
${section('Projects', cv.projects.map((p) => `<div class="role"><b>${esc(p.name)}</b>${p.url ? ` <span class="muted">${esc(p.url)}</span>` : ''}<div>${esc(p.description)}</div></div>`).join(''))}
${section('Education', cv.education.map((e) => `<div class="role"><div class="role-head"><div><b>${esc(e.qualification)}</b>${e.grade ? ` (${esc(e.grade)})` : ''}, ${esc(e.institution)}</div><div class="muted">${esc(dateRange(e.start, e.end))}</div></div>${e.details ? `<div class="muted">${esc(e.details)}</div>` : ''}</div>`).join(''))}
${section('Certifications', cv.certifications.length ? `<ul>${cv.certifications.map((c) => `<li>${esc(c.name)}${c.issuer ? `, ${esc(c.issuer)}` : ''}${c.year ? ` (${esc(c.year)})` : ''}</li>`).join('')}</ul>` : '')}
${section('Additional information', [...cv.extras, ...(cv.languages.length ? [`Languages: ${cv.languages.join(', ')}`] : [])].length ? `<ul>${[...cv.extras, ...(cv.languages.length ? [`Languages: ${cv.languages.join(', ')}`] : [])].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')}
${section('References', `<p>${esc(cv.references)}</p>`)}`);
}

export function letterHtml(l) {
  const block = (arr) => arr.map(esc).join('<br>');
  return shell(`${l.name} – cover letter`, `<div class="letter">
<div class="sender">${block(l.sender)}<br><br>${esc(l.date)}</div>
<div class="recipient">${block(l.recipient)}</div>
<p>${esc(l.greeting)}</p>
${l.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
<p>${esc(l.signOff)}<br><br>${esc(l.name)}</p></div>`);
}
