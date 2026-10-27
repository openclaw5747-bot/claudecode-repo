// Starting a profile from what you already have: a CV (PDF, Word or text) and LinkedIn's own
// "Save to PDF" export of your profile. The AI reads them into profile fields, which are merged
// into the profile for you to check before saving.
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const isPdf = (buf) => buf.subarray(0, 5).toString('latin1') === '%PDF-';
const isZip = (buf) => buf[0] === 0x50 && buf[1] === 0x4b; // .docx is a zip

/** Reads an uploaded file into text (and keeps a PDF's bytes, which Claude can read directly). */
export async function readUpload(name, buf) {
  if (!buf.length) throw new Error(`${name} is empty.`);
  if (buf.length > MAX_UPLOAD_BYTES) throw new Error(`${name} is larger than 10 MB.`);
  const ext = name.toLowerCase().split('.').pop();
  if (isPdf(buf)) {
    let text = '';
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      text = (await extractText(pdf, { mergePages: true })).text;
    } catch { throw new Error(`Couldn't read ${name} as a PDF.`); }
    return { name, kind: 'pdf', text: text.trim(), pdf: buf.toString('base64') };
  }
  if (isZip(buf) && ext === 'docx') {
    const { value } = await mammoth.extractRawText({ buffer: buf }).catch(() => { throw new Error(`Couldn't read ${name} as a Word document.`); });
    return { name, kind: 'docx', text: value.trim() };
  }
  if (ext === 'doc') throw new Error(`${name} is an old Word (.doc) file. Save it as .docx or PDF and try again.`);
  if (['txt', 'md', 'text', 'rtf'].includes(ext) || !buf.subarray(0, 1000).includes(0)) {
    return { name, kind: 'text', text: buf.toString('utf8').trim() };
  }
  throw new Error(`${name} isn't a PDF, Word (.docx) or text file.`);
}

/** Tidies a LinkedIn profile address to https://www.linkedin.com/in/<name>. */
export function linkedinUrl(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  const m = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]+)\/?(?:[?#].*)?$/i.exec(s);
  if (!m) throw new Error("That doesn't look like a LinkedIn profile address (linkedin.com/in/your-name).");
  return `https://www.linkedin.com/in/${m[1]}`;
}

const clean = (s) => String(s ?? '').trim();
const key = (...parts) => parts.map((p) => clean(p).toLowerCase().replace(/[^a-z0-9]/g, '')).join('|');
const SCALARS = ['name', 'email', 'phone', 'town', 'postcode', 'linkedin', 'website', 'headline', 'statement', 'noticePeriod', 'clearance'];
const LISTS = {
  experience: (e) => key(e.title, e.employer, e.start),
  education: (e) => key(e.qualification, e.institution),
  certifications: (c) => key(c.name),
  projects: (p) => key(p.name),
};

/**
 * Fills the gaps in `current` from `found`. What you have already typed always wins; new jobs,
 * qualifications, certifications and projects are added; skills and languages are combined.
 * Returns the merged profile and a list of what changed.
 */
export function mergeProfile(current, found) {
  const merged = structuredClone(current);
  const added = [];
  for (const f of SCALARS) {
    if (!clean(merged[f]) && clean(found[f])) { merged[f] = clean(found[f]); added.push(f); }
  }
  if (!merged.drivingLicence && found.drivingLicence) { merged.drivingLicence = true; added.push('drivingLicence'); }
  for (const f of ['skills', 'languages']) {
    const have = new Set((merged[f] || []).map((s) => s.toLowerCase()));
    const extra = (found[f] || []).map(clean).filter((s) => s && !have.has(s.toLowerCase()) && have.add(s.toLowerCase()));
    if (extra.length) { merged[f] = [...(merged[f] || []), ...extra]; added.push(`${extra.length} ${f}`); }
  }
  for (const [f, keyOf] of Object.entries(LISTS)) {
    const have = new Set((merged[f] || []).map(keyOf));
    const extra = (found[f] || []).filter((e) => !have.has(keyOf(e)) && have.add(keyOf(e)));
    if (extra.length) { merged[f] = [...(merged[f] || []), ...extra]; added.push(`${extra.length} ${f}`); }
  }
  return { profile: merged, added };
}
