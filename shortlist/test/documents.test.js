import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assemble, cvHtml, letterHtml, dateRange, longDate } from '../lib/documents.js';

const profile = {
  name: 'Priya Shah', email: 'priya@example.com', phone: '07700 900123', town: 'Leeds', headline: 'Junior Software Engineer',
  skills: ['TypeScript', 'React', 'PostgreSQL', 'Git'], languages: ['Gujarati (fluent)'], drivingLicence: true, rightToWork: 'British or Irish citizen',
  experience: [
    { id: 'e1', title: 'Junior Developer', employer: 'Acme Ltd', location: 'Leeds', start: '2025-01', end: '', achievements: ['Cut page load time by 40%', 'Built the booking form'] },
    { id: 'e2', title: 'Retail Assistant', employer: 'Boots', location: 'Leeds', start: '2022-06', end: '2024-12', achievements: ['Trained 3 new starters'] },
  ],
  education: [{ id: 'ed1', qualification: 'BSc (Hons) Computer Science', institution: 'University of Leeds', grade: '2:1', start: '2021-09', end: '2024-06' }],
  certifications: [], projects: [{ id: 'p1', name: 'Bus times app', description: 'A React app for First Bus times' }],
  references: 'Available on request',
};

const draft = {
  personalStatement: 'Computer Science graduate who cut page load time by 40% at Acme.',
  keySkills: ['typescript', 'React', 'Kubernetes'],
  experience: [{ id: 'e1', bullets: ['Cut page load time by 40%', 'Served 2,000,000 users'] }, { id: 'made-up', bullets: ['Led a team of 10'] }],
  projectIds: ['p1', 'p9'],
  coverLetter: { paragraphs: ['I would like to apply.', 'At Acme I cut load time by 40%.'] },
  email: { subject: 'Application: Junior Developer', body: 'Please find my CV and cover letter attached.' },
  gaps: ['Kubernetes'],
};

test('keeps facts from the profile and drops what the AI invented', () => {
  const docs = assemble(profile, { employer: 'Widgets plc', location: 'Leeds', contactName: '', contactEmail: 'jobs@widgets.example' }, draft, { now: new Date('2026-10-27') });
  assert.deepEqual(docs.cv.keySkills, ['TypeScript', 'React']);
  assert.deepEqual(docs.cv.experience.map((e) => e.employer), ['Acme Ltd', 'Boots']);
  assert.deepEqual(docs.cv.experience[1].bullets, ['Trained 3 new starters']); // a role the AI skipped keeps the profile's own lines
  assert.deepEqual(docs.cv.projects.map((p) => p.id), ['p1']);
  assert.ok(docs.issues.some((i) => i.includes('Kubernetes')));
  assert.ok(docs.issues.some((i) => i.includes('made up')));
  assert.ok(docs.issues.some((i) => i.includes('2,000,000')), 'a figure not in the profile is flagged');
  assert.ok(!docs.issues.some((i) => i.includes('40%')), 'a figure from the profile is not flagged');
  assert.ok(docs.cv.extras.includes('Full UK driving licence'));
});

test('follows British letter conventions', () => {
  const unnamed = assemble(profile, { employer: 'Widgets plc', contactName: '' }, draft, { now: new Date('2026-10-27') }).coverLetter;
  assert.equal(unnamed.greeting, 'Dear Hiring Manager,');
  assert.equal(unnamed.signOff, 'Yours faithfully,');
  assert.equal(unnamed.date, '27 October 2026');
  const named = assemble(profile, { employer: 'Widgets plc', contactName: 'Ms Patel' }, draft).coverLetter;
  assert.equal(named.greeting, 'Dear Ms Patel,');
  assert.equal(named.signOff, 'Yours sincerely,');
});

test('dates read the British way', () => {
  assert.equal(dateRange('2025-01', ''), 'Jan 2025 – Present');
  assert.equal(longDate(new Date('2026-03-05')), '5 March 2026');
});

test('printable pages escape what they show', () => {
  const docs = assemble({ ...profile, name: 'Priya <script>' }, { employer: 'X' }, draft);
  assert.ok(!cvHtml(docs.cv).includes('Priya <script>'));
  assert.ok(cvHtml(docs.cv).includes('Priya &lt;script&gt;'));
  assert.ok(!letterHtml(docs.coverLetter).includes('Priya <script>'));
  assert.match(cvHtml(docs.cv), /size: A4/);
});

test('reports a figure in full', () => {
  const docs = assemble(profile, { employer: 'X' }, { ...draft, coverLetter: { paragraphs: ['We served 2 million users.'] } });
  assert.ok(docs.issues.some((i) => i.includes('"2 million"')));
});

test('documents carry placeholders, not your email or phone number', () => {
  const docs = assemble({ ...profile, email: 'priya@example.com', phone: '07700 900123' }, { employer: 'X', contactName: '' }, draft);
  const all = JSON.stringify(docs);
  assert.ok(!all.includes('priya@example.com') && !all.includes('07700 900123'));
  assert.deepEqual(docs.cv.contact.slice(0, 3), ['Leeds', '[[phone]]', '[[email]]']);
  assert.match(docs.email.body, /Kind regards,\nPriya Shah\n\[\[phone\]\]$/);
  const html = cvHtml(docs.cv);
  assert.match(html, /<span data-private="phone"><\/span>/);
  assert.match(html, /localStorage\.getItem\('shortlist\.contact'\)/);
  assert.match(letterHtml(docs.coverLetter), /<div data-private="email"><\/div>/);
});
