import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readUpload, mergeProfile, linkedinUrl } from '../lib/cv-import.js';
import { createProvider, importProfile } from '../lib/ai.js';

// A one-page PDF saying `text`, with a correct cross-reference table.
function makePdf(text) {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = `BT /F1 12 Tf 72 770 Td (${text}) Tj ET`;
  objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let out = '%PDF-1.4\n';
  const offsets = objs.map((o, i) => { const at = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return at; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

test('reads a PDF CV, keeping the file for Claude and the text for a local model', async () => {
  const doc = await readUpload('cv.pdf', makePdf('Priya Shah - Junior Developer at Acme Ltd'));
  assert.equal(doc.kind, 'pdf');
  assert.match(doc.text, /Priya Shah - Junior Developer at Acme Ltd/);
  assert.ok(doc.pdf.length > 100);
});

test('reads text files and refuses what it cannot read', async () => {
  assert.equal((await readUpload('cv.txt', Buffer.from('Priya Shah\nLeeds'))).text, 'Priya Shah\nLeeds');
  await assert.rejects(readUpload('cv.doc', Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0])), /old Word/);
  await assert.rejects(readUpload('photo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0])), /isn't a PDF/);
  await assert.rejects(readUpload('cv.pdf', Buffer.alloc(0)), /empty/);
});

test('tidies LinkedIn addresses and rejects anything else', () => {
  assert.equal(linkedinUrl('linkedin.com/in/priya-shah'), 'https://www.linkedin.com/in/priya-shah');
  assert.equal(linkedinUrl('https://uk.linkedin.com/in/priya-shah/?originalSubdomain=uk'), 'https://www.linkedin.com/in/priya-shah');
  assert.equal(linkedinUrl(''), '');
  assert.throws(() => linkedinUrl('https://example.com/in/priya'), /LinkedIn profile address/);
  assert.throws(() => linkedinUrl('https://www.linkedin.com/company/acme'), /LinkedIn profile address/);
});

test('merging keeps what you typed and adds what is new', () => {
  const current = {
    name: 'Priya Shah', email: '', town: 'Leeds', skills: ['React'], languages: [], drivingLicence: false,
    experience: [{ id: 'e1', title: 'Junior Developer', employer: 'Acme Ltd', start: '2025-01', achievements: ['Mine'] }],
    education: [], certifications: [], projects: [],
  };
  const found = {
    name: 'P. Shah', email: 'priya@example.com', town: 'London', skills: ['react', 'TypeScript'], languages: ['Gujarati (fluent)'], drivingLicence: true,
    experience: [
      { title: 'Junior developer', employer: 'ACME LTD', start: '2025-01', achievements: ['Theirs'] },
      { title: 'Retail Assistant', employer: 'Boots', start: '2022-06', achievements: [] },
    ],
    education: [{ qualification: 'BSc (Hons) Computer Science', institution: 'University of Leeds' }], certifications: [], projects: [],
  };
  const { profile, added } = mergeProfile(current, found);
  assert.equal(profile.name, 'Priya Shah');
  assert.equal(profile.town, 'Leeds');
  assert.equal(profile.email, 'priya@example.com');
  assert.deepEqual(profile.skills, ['React', 'TypeScript']);
  assert.deepEqual(profile.experience.map((e) => e.employer), ['Acme Ltd', 'Boots']);
  assert.equal(profile.experience[0].achievements[0], 'Mine');
  assert.equal(profile.drivingLicence, true);
  assert.deepEqual(added, ['email', 'drivingLicence', '1 skills', '1 languages', '1 experience', '1 education']);
  assert.equal(current.experience.length, 1, 'the current profile is not changed');
});

test('a local model gets the documents as text and the LinkedIn address', async () => {
  const provider = createProvider({ AI_PROVIDER: 'ollama', OLLAMA_MODEL: 'm' });
  const answer = { name: 'Priya Shah', email: '', phone: '', town: 'Leeds', postcode: '', linkedin: '', website: '', headline: '', statement: '', skills: [], languages: [], drivingLicence: false, noticePeriod: '', clearance: '', experience: [], education: [], certifications: [], projects: [] };
  let body;
  provider.fetch = async (url, opts) => { body = JSON.parse(opts.body); return Response.json({ message: { content: JSON.stringify(answer) } }); };
  const out = await importProfile(provider, [{ name: 'cv.pdf', kind: 'pdf', text: 'Priya Shah, Leeds', pdf: 'xx' }], 'https://www.linkedin.com/in/priya');
  assert.equal(out.town, 'Leeds');
  assert.match(body.messages[1].content, /<document name="cv.pdf">\nPriya Shah, Leeds/);
  assert.match(body.messages[1].content, /linkedin\.com\/in\/priya/);
  await assert.rejects(importProfile(provider, [{ name: 'scan.pdf', kind: 'pdf', text: '', pdf: 'xx' }]), /scan/);
});

test('Claude gets a PDF as a document, and other files as text', async () => {
  const provider = createProvider({ ANTHROPIC_API_KEY: 'x' });
  let args;
  provider.client.beta.messages.parse = async (a) => { args = a; return { stop_reason: 'end_turn', parsed_output: { name: 'Priya' } }; };
  await importProfile(provider, [{ name: 'cv.pdf', kind: 'pdf', text: 't', pdf: 'QUJD' }, { name: 'notes.txt', kind: 'text', text: 'Extra notes' }]);
  const [doc, text] = args.messages[0].content;
  assert.deepEqual(doc, { type: 'document', title: 'cv.pdf', source: { type: 'base64', media_type: 'application/pdf', data: 'QUJD' } });
  assert.match(text.text, /<document name="notes.txt">\nExtra notes/);
  assert.equal(args.model, 'claude-opus-5-5');
});
