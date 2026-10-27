import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseCsv, normaliseName, buildIndex, SponsorRegister } from '../lib/sponsors.js';

const CSV = `﻿Organisation Name,Town/City,County,Type & Rating,Route
 Deliveroo Ltd,London,,Worker (A rating),Skilled Worker
"Smith & Jones (UK) Limited","Leeds",West Yorkshire,Worker (A rating),Skilled Worker
"Smith & Jones (UK) Limited","Leeds",West Yorkshire,Temporary Worker (A rating),Creative Worker
"Acme, ""The"" Widgets PLC",Bristol,,Worker (B rating),Skilled Worker
Acme Software Group Holdings Ltd,Bath,,Worker (A rating),Skilled Worker
`;

test('parses quoted CSV fields', () => {
  const rows = parseCsv('a,"b, c","d ""e"""\n1,2,3');
  assert.deepEqual(rows, [['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
});

test('normalises company names the way boards and the register differ', () => {
  assert.equal(normaliseName('Smith & Jones (UK) Limited'), 'smith and jones');
  assert.equal(normaliseName('SMITH AND JONES LTD.'), 'smith and jones');
  assert.equal(normaliseName('The Deliveroo Group plc'), 'deliveroo');
});

test('indexes the register and merges routes for one organisation', () => {
  const index = buildIndex(CSV);
  const sj = index.get('smith and jones');
  assert.deepEqual([...sj.routes], ['Skilled Worker', 'Creative Worker']);
});

test('downloads the register from GOV.UK and looks employers up', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'shortlist-'));
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes('gov.uk/government')) return new Response('<a href="https://assets.publishing.service.gov.uk/media/x/Register_-_2026-10-27.csv">CSV</a>');
    return new Response(CSV);
  };
  const reg = new SponsorRegister(dir, { fetchImpl });
  const meta = await reg.load();
  assert.equal(meta.publishedName, 'Register_-_2026-10-27.csv');
  assert.equal(calls.length, 2);
  assert.equal(reg.lookup('Deliveroo').match, 'exact');
  assert.equal(reg.lookup('Smith and Jones Ltd').name, 'Smith & Jones (UK) Limited');
  assert.equal(reg.lookup('Acme Software').match, 'possible');
  assert.equal(reg.lookup('Nobody Real Ltd').match, 'none');
  assert.equal(reg.search('acme').length, 2);

  // A second register within a day reuses the file on disk.
  const again = new SponsorRegister(dir, { fetchImpl });
  await again.load();
  assert.equal(calls.length, 2);
  assert.equal(again.lookup('Deliveroo').match, 'exact');
});

test('finds an employer by the trading name after "t/a"', () => {
  const index = buildIndex('Organisation Name,Town/City,County,Type & Rating,Route\nRoofoods Ltd t/a Deliveroo,London,,Worker (A rating),Skilled Worker\n');
  assert.equal(index.get('deliveroo').name, 'Roofoods Ltd t/a Deliveroo');
  assert.equal(index.get('roofoods'), index.get('deliveroo'));
});
