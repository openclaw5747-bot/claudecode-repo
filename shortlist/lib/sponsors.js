// The Home Office's register of licensed sponsors: every employer that may sponsor a Skilled
// Worker (or other) visa. It is published as a CSV on GOV.UK and updated most working days.
import fs from 'node:fs/promises';
import path from 'node:path';

const PAGE = 'https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Words that differ between how a job board and the register spell the same company.
const NOISE = new Set(['ltd', 'limited', 'plc', 'llp', 'lp', 'inc', 'incorporated', 'co', 'company', 'the', 'uk', 'gb', 'group']);

export function normaliseName(name = '') {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !NOISE.has(w))
    .join(' ');
}

/** A small RFC 4180 parser: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Builds an index of normalised name → { name, towns, routes, ratings }. */
export function buildIndex(csvText) {
  const [header, ...rows] = parseCsv(csvText.replace(/^﻿/, ''));
  const col = (label) => header.findIndex((h) => h.trim().toLowerCase().startsWith(label));
  const iName = col('organisation'), iTown = col('town'), iRating = col('type'), iRoute = col('route');
  const index = new Map();
  for (const r of rows) {
    const name = (r[iName] || '').trim();
    if (!name) continue;
    // "Roofoods Ltd t/a Deliveroo": the register gives legal names, boards give trading names.
    const keys = [...new Set(name.split(/\s+(?:t\/a|ta|trading as)\s+/i).map(normaliseName).filter(Boolean))];
    if (!keys.length) continue;
    let entry = keys.map((k) => index.get(k)).find(Boolean);
    if (!entry) entry = { name, towns: new Set(), routes: new Set(), ratings: new Set() };
    for (const k of keys) if (!index.has(k)) index.set(k, entry);
    if (r[iTown]?.trim()) entry.towns.add(r[iTown].trim());
    if (r[iRoute]?.trim()) entry.routes.add(r[iRoute].trim());
    if (r[iRating]?.trim()) entry.ratings.add(r[iRating].trim());
  }
  return index;
}

function toResult(entry) {
  return { name: entry.name, towns: [...entry.towns].slice(0, 5), routes: [...entry.routes], ratings: [...entry.ratings] };
}

export class SponsorRegister {
  constructor(dataDir, { fetchImpl = fetch } = {}) {
    this.file = path.join(dataDir, 'sponsors.csv');
    this.metaFile = path.join(dataDir, 'sponsors.json');
    this.fetch = fetchImpl;
    this.index = null;
    this.meta = null;
    this.loading = null;
  }

  async load() {
    this.loading ??= this.#load().finally(() => { this.loading = null; });
    return this.loading;
  }

  async #load() {
    let meta = null;
    try { meta = JSON.parse(await fs.readFile(this.metaFile, 'utf8')); } catch {}
    const stale = !meta || Date.now() - meta.fetchedAt > MAX_AGE_MS;
    if (stale) {
      try { meta = await this.#download(); }
      catch (err) {
        if (!meta) throw new Error(`Couldn't download the sponsor register from GOV.UK: ${err.message}`);
        console.warn(`Sponsor register: keeping the copy from ${meta.publishedName}, refresh failed: ${err.message}`);
      }
    }
    if (!this.index || stale) {
      this.index = buildIndex(await fs.readFile(this.file, 'utf8'));
      this.meta = { ...meta, organisations: new Set(this.index.values()).size };
    }
    return this.meta;
  }

  async #download() {
    const page = await this.fetch(PAGE).then((r) => { if (!r.ok) throw new Error(`GOV.UK answered ${r.status}`); return r.text(); });
    const url = page.match(/https:\/\/assets\.publishing\.service\.gov\.uk\/[^"']+\.csv/)?.[0];
    if (!url) throw new Error('no CSV link on the GOV.UK page');
    const res = await this.fetch(url);
    if (!res.ok) throw new Error(`the CSV answered ${res.status}`);
    await fs.writeFile(this.file, await res.text());
    const meta = { url, publishedName: decodeURIComponent(url.split('/').pop()), fetchedAt: Date.now() };
    await fs.writeFile(this.metaFile, JSON.stringify(meta));
    return meta;
  }

  /** Looks an employer up: an exact match on the normalised name, else names that start with it. */
  lookup(employer) {
    if (!this.index || !employer) return null;
    const key = normaliseName(employer);
    if (!key) return null;
    const exact = this.index.get(key);
    if (exact) return { match: 'exact', ...toResult(exact) };
    if (key.length < 4) return null;
    const close = new Set();
    for (const [k, entry] of this.index) {
      if (k.startsWith(key + ' ') || key.startsWith(k + ' ')) close.add(entry);
      if (close.size >= 5) break;
    }
    return close.size ? { match: 'possible', candidates: [...close].map(toResult) } : { match: 'none' };
  }

  search(query, limit = 25) {
    if (!this.index) return [];
    const key = normaliseName(query);
    if (key.length < 2) return [];
    const found = new Set();
    for (const [k, entry] of this.index) {
      if (k.includes(key)) found.add(entry);
      if (found.size >= limit) break;
    }
    return [...found].map(toResult);
  }
}
