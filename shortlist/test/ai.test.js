import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProvider, analyse } from '../lib/ai.js';

const analysis = { title: 'Junior Developer', employer: 'Acme Ltd', location: 'Leeds', salary: '£30,000', contactName: '', contactEmail: '', summary: 'A role.', requirements: [{ requirement: 'React', essential: true, status: 'met', evidence: 'React in skills' }], score: 80, ukNotes: [] };

test('chooses a provider from the environment', () => {
  assert.equal(createProvider({}), null);
  assert.match(createProvider({ ANTHROPIC_API_KEY: 'x' }).label, /claude-opus-5-5/);
  assert.match(createProvider({ AI_PROVIDER: 'ollama', OLLAMA_MODEL: 'qwen3:14b' }).label, /Ollama/);
});

test('a local model gets the schema and its answer is validated', async () => {
  const provider = createProvider({ AI_PROVIDER: 'ollama', OLLAMA_MODEL: 'm' });
  let body;
  provider.fetch = async (url, opts) => { body = JSON.parse(opts.body); return Response.json({ message: { content: JSON.stringify(analysis) } }); };
  const out = await analyse(provider, { name: 'P' }, 'posting');
  assert.equal(out.score, 80);
  assert.equal(body.format.type, 'object');
  assert.match(body.messages[0].content, /British English/);

  provider.fetch = async () => Response.json({ message: { content: JSON.stringify({ title: 'x' }) } });
  await assert.rejects(analyse(provider, {}, 'posting'), /didn't match/);
});
