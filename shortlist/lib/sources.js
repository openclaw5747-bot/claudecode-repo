// UK job boards with free APIs. Each returns postings in one shape:
// { id, source, sourceId, title, employer, location, salaryMin, salaryMax, salaryPredicted,
//   contract, posted, closes, url, description, descriptionIsFull }
import { annualise } from './salary.js';

const stripHtml = (html = '') =>
  html.replace(/<(br|\/p|\/li|\/h\d)\s*\/?>/gi, '\n').replace(/<li>/gi, '• ').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&pound;/g, '£').replace(/&#163;/g, '£')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n').trim();

// Reed dates are dd/mm/yyyy.
const reedDate = (d) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

export function reed({ apiKey, fetchImpl = fetch }) {
  const auth = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
  const get = async (url) => {
    const res = await fetchImpl(url, { headers: { Authorization: auth } });
    if (res.status === 401) throw new Error('Reed rejected the API key (REED_API_KEY).');
    if (!res.ok) throw new Error(`Reed answered ${res.status}.`);
    return res.json();
  };
  const toPosting = (j, full = false) => ({
    id: `reed:${j.jobId}`,
    source: 'Reed',
    sourceId: String(j.jobId),
    title: j.jobTitle,
    employer: j.employerName,
    location: j.locationName,
    salaryMin: j.minimumSalary || null,
    salaryMax: j.maximumSalary || null,
    salaryPredicted: false,
    contract: [j.contractType, j.fullTime ? 'full-time' : j.partTime ? 'part-time' : null].filter(Boolean).join(', ') || null,
    posted: reedDate(j.date || j.datePosted),
    closes: reedDate(j.expirationDate),
    url: j.jobUrl || j.externalUrl || `https://www.reed.co.uk/jobs/${j.jobId}`,
    description: stripHtml(j.jobDescription),
    descriptionIsFull: full,
  });
  return {
    name: 'Reed',
    async search({ keywords, location, miles = 10, minSalary, page = 1 }) {
      const q = new URLSearchParams({ keywords, resultsToTake: '50', resultsToSkip: String((page - 1) * 50) });
      if (location) { q.set('locationName', location); q.set('distanceFromLocation', String(miles)); }
      if (minSalary) q.set('minimumSalary', String(minSalary));
      const data = await get(`https://www.reed.co.uk/api/1.0/search?${q}`);
      return { total: data.totalResults ?? 0, postings: (data.results || []).map((j) => toPosting(j)) };
    },
    async details(sourceId) {
      return toPosting(await get(`https://www.reed.co.uk/api/1.0/jobs/${encodeURIComponent(sourceId)}`), true);
    },
  };
}

export function adzuna({ appId, appKey, fetchImpl = fetch }) {
  const toPosting = (j) => ({
    id: `adzuna:${j.id}`,
    source: 'Adzuna',
    sourceId: String(j.id),
    title: stripHtml(j.title),
    employer: j.company?.display_name || null,
    location: j.location?.display_name || null,
    salaryMin: j.salary_min || null,
    salaryMax: j.salary_max || null,
    salaryPredicted: j.salary_is_predicted === '1' || j.salary_is_predicted === 1,
    contract: [j.contract_type, j.contract_time?.replace('_', '-')].filter(Boolean).join(', ') || null,
    posted: j.created?.slice(0, 10) || null,
    closes: null,
    url: j.redirect_url,
    description: stripHtml(j.description),
    descriptionIsFull: false,
  });
  return {
    name: 'Adzuna',
    async search({ keywords, location, miles = 10, minSalary, page = 1 }) {
      const q = new URLSearchParams({ app_id: appId, app_key: appKey, what: keywords, results_per_page: '50', 'content-type': 'application/json' });
      if (location) { q.set('where', location); q.set('distance', String(Math.round(miles * 1.609))); }
      if (minSalary) q.set('salary_min', String(minSalary));
      const res = await fetchImpl(`https://api.adzuna.com/v1/api/jobs/gb/search/${page}?${q}`);
      if (res.status === 401 || res.status === 403) throw new Error('Adzuna rejected the app ID or key (ADZUNA_APP_ID, ADZUNA_APP_KEY).');
      if (!res.ok) throw new Error(`Adzuna answered ${res.status}.`);
      const data = await res.json();
      return { total: data.count ?? 0, postings: (data.results || []).map(toPosting) };
    },
    async details() { return null; }, // Adzuna only gives a snippet; the full text is on the employer's page.
  };
}

const dedupeKey = (p) => `${(p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')}|${(p.employer || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;

/** Searches every configured board at once and merges the results, keeping the first copy of a duplicate. */
export async function searchAll(sources, params) {
  const settled = await Promise.allSettled(sources.map((s) => s.search(params)));
  const seen = new Set();
  const postings = [];
  const errors = [];
  settled.forEach((r, i) => {
    if (r.status === 'rejected') return errors.push(`${sources[i].name}: ${r.reason.message}`);
    for (const p of r.value.postings) {
      const k = dedupeKey(p);
      if (seen.has(k)) continue;
      seen.add(k);
      postings.push(p);
    }
  });
  if (params.sort === 'salary') postings.sort((a, b) => annualise(b.salaryMax || b.salaryMin) - annualise(a.salaryMax || a.salaryMin));
  else postings.sort((a, b) => (b.posted || '').localeCompare(a.posted || ''));
  return { postings, errors };
}

export { stripHtml };
