import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redact, withoutPrivate } from '../lib/privacy.js';

test('takes email, phone and home address out of a CV, keeping the town', () => {
  const { text, found } = redact('Priya Shah\n12 Hyde Park Road, Leeds LS6 2AB\n07700 900123 | priya.shah@example.com\n\nJunior Developer, Acme Ltd');
  assert.equal(text, 'Priya Shah\n[home address removed], Leeds\n[phone removed] | [email removed]\n\nJunior Developer, Acme Ltd');
  assert.deepEqual(found, { email: 'priya.shah@example.com', phone: '07700 900123', postcode: 'LS6' });
});

test('handles the ways UK phone numbers and addresses are written', () => {
  for (const phone of ['+44 7700 900123', '+44 (0)113 496 0000', '(0113) 496 0000', '020 7946 0000', '07700900123', '0117-496-0000']) {
    assert.equal(redact(`Tel: ${phone}`).text, 'Tel: [phone removed]', phone);
  }
  assert.equal(redact('Flat 2, 4 Mill Lane, Bristol, BS1 4DJ').text, '[home address removed], Bristol');
  assert.equal(redact('Hyde Park Road, LS6 2AB').text, '[home address removed]', 'a street name is not mistaken for a town');
  assert.equal(redact('27 Mill Lane').text, '[home address removed]');
});

test('leaves the rest of the CV alone', () => {
  for (const line of ['Cut costs by 40% in 2023; managed 12 staff', 'Led 3 Park Run events for 200 runners', 'Grew revenue from £1.2m to £2m', 'BSc (Hons) Computer Science, 2:1, 2021 – 2024', 'Ran a 5k on 01/02/2024']) {
    assert.equal(redact(line).text, line);
  }
});

test('profiles lose their private fields', () => {
  assert.deepEqual(withoutPrivate({ name: 'P', email: 'e', phone: 'p', postcode: 'LS6', town: 'Leeds' }), { name: 'P', town: 'Leeds' });
});
