import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reed, adzuna, searchAll } from '../lib/sources.js';

const reedJob = { jobId: 51, employerName: 'Acme Ltd', jobTitle: 'Junior Developer', locationName: 'Leeds', minimumSalary: 28000, maximumSalary: 32000, date: '20/10/2026', expirationDate: '01/12/2026', jobDescription: 'Build things &amp; ship them.<br/>Hybrid.', jobUrl: 'https://www.reed.co.uk/jobs/51' };

test('Reed: searches with basic auth and maps postings', async () => {
  let seen;
  const fetchImpl = async (url, opts) => { seen = { url, opts }; return Response.json({ totalResults: 1, results: [reedJob] }); };
  const r = await reed({ apiKey: 'key', fetchImpl }).search({ keywords: 'developer', location: 'Leeds', miles: 15 });
  assert.match(seen.url, /keywords=developer.*locationName=Leeds.*distanceFromLocation=15/);
  assert.equal(seen.opts.headers.Authorization, 'Basic ' + Buffer.from('key:').toString('base64'));
  assert.equal(r.postings[0].posted, '2026-10-20');
  assert.equal(r.postings[0].closes, '2026-12-01');
  assert.equal(r.postings[0].description, 'Build things & ship them.\nHybrid.');
});

test('Adzuna: searches the GB endpoint, converting miles to km', async () => {
  let seen;
  const fetchImpl = async (url) => { seen = url; return Response.json({ count: 1, results: [{ id: '9', title: '<strong>Junior</strong> Developer', company: { display_name: 'Acme Ltd' }, location: { display_name: 'Leeds, West Yorkshire' }, salary_min: 30000, salary_max: 30000, salary_is_predicted: '1', created: '2026-10-21T09:00:00Z', redirect_url: 'https://adzuna.co.uk/x', description: 'Snippet' }] }); };
  const r = await adzuna({ appId: 'a', appKey: 'b', fetchImpl }).search({ keywords: 'developer', location: 'Leeds', miles: 10 });
  assert.match(seen, /\/jobs\/gb\/search\/1\?/);
  assert.match(seen, /distance=16/);
  assert.equal(r.postings[0].title, 'Junior Developer');
  assert.equal(r.postings[0].salaryPredicted, true);
});

test('merges boards, drops duplicates, and reports a failing board without failing the search', async () => {
  const a = { name: 'A', search: async () => ({ postings: [{ id: 'a1', title: 'Junior Developer', employer: 'Acme Ltd', posted: '2026-10-20' }] }) };
  const b = { name: 'B', search: async () => ({ postings: [{ id: 'b1', title: 'Junior developer', employer: 'ACME LTD', posted: '2026-10-21' }, { id: 'b2', title: 'Tester', employer: 'Zed', posted: '2026-10-22' }] }) };
  const c = { name: 'C', search: async () => { throw new Error('down'); } };
  const r = await searchAll([a, b, c], { keywords: 'x' });
  assert.deepEqual(r.postings.map((p) => p.id), ['b2', 'a1']);
  assert.deepEqual(r.errors, ['C: down']);
});
