import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatSalary, annualise, ukFlags } from '../lib/salary.js';

test('formats annual, daily and hourly pay in pounds', () => {
  assert.equal(formatSalary(30000, 35000), '£30,000–£35,000 a year');
  assert.equal(formatSalary(450, 450), '£450 a day');
  assert.equal(formatSalary(12.21, 0), '£12.21 an hour');
  assert.equal(formatSalary(0, 40000, { predicted: true }), '£40,000 a year (estimated)');
  assert.equal(formatSalary(null, null), null);
});

test('annualises day and hourly rates for sorting', () => {
  assert.equal(annualise(500), 115000);
  assert.equal(annualise(40000), 40000);
  assert.equal(annualise(20), 34500);
});

test('spots UK-specific conditions in a posting', () => {
  assert.deepEqual(ukFlags('Contract role, outside IR35, hybrid in Leeds'), ['Outside IR35', 'Hybrid']);
  assert.ok(ukFlags('We are unable to offer visa sponsorship for this role').includes('Says no sponsorship'));
  assert.ok(ukFlags('Visa sponsorship is available').includes('Offers sponsorship'));
  assert.ok(ukFlags('Candidates must hold active SC clearance').includes('Security clearance'));
  assert.ok(ukFlags('An enhanced DBS check is required').includes('DBS check'));
  assert.ok(ukFlags('Full UK driving licence essential').includes('Driving licence'));
});
