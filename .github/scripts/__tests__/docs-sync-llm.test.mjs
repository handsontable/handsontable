import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completionsUrl, createClient } from '../lib/docs-sync/llm.mjs';

const ok = (content) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const noSleep = async() => {};

test('the completions URL tolerates a base with or without /v1 and trailing slashes', () => {
  assert.equal(completionsUrl('https://llm.example.com'), 'https://llm.example.com/v1/chat/completions');
  assert.equal(completionsUrl('https://llm.example.com/'), 'https://llm.example.com/v1/chat/completions');
  assert.equal(completionsUrl('https://llm.example.com/v1'), 'https://llm.example.com/v1/chat/completions');
});

test('complete posts an OpenAI-shaped JSON request and returns the content', async() => {
  const calls = [];
  const fetchImpl = async(url, init) => {
    calls.push({ url, init });

    return ok('{"decision":"include","reason":"x"}');
  };
  const client = createClient({ baseUrl: 'https://llm.example.com', apiKey: 'k', model: 'm', fetchImpl, sleep: noSleep });

  const content = await client.complete({ system: 'S', user: 'U' });

  assert.equal(content, '{"decision":"include","reason":"x"}');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://llm.example.com/v1/chat/completions');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer k');

  const body = JSON.parse(calls[0].init.body);

  assert.equal(body.model, 'm');
  assert.equal(body.temperature, 0);
  assert.deepEqual(body.response_format, { type: 'json_object' });
  assert.deepEqual(body.messages, [{ role: 'system', content: 'S' }, { role: 'user', content: 'U' }]);
});

test('5xx and 429 are retried, then the last error surfaces', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;

    return new Response('busy', { status: n === 1 ? 503 : 429 });
  };
  const client = createClient({ baseUrl: 'https://x', apiKey: 'k', model: 'm', fetchImpl, sleep: noSleep, attempts: 3 });

  await assert.rejects(() => client.complete({ system: 's', user: 'u' }), /429/);
  assert.equal(n, 3);
});

test('a network error is retried and a later success wins', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;
    if (n === 1) {
      throw new Error('ECONNRESET');
    }

    return ok('fine');
  };
  const client = createClient({ baseUrl: 'https://x', apiKey: 'k', model: 'm', fetchImpl, sleep: noSleep });

  assert.equal(await client.complete({ system: 's', user: 'u' }), 'fine');
  assert.equal(n, 2);
});

test('a 4xx other than 429 fails immediately', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;

    return new Response('bad key', { status: 401 });
  };
  const client = createClient({ baseUrl: 'https://x', apiKey: 'k', model: 'm', fetchImpl, sleep: noSleep });

  await assert.rejects(() => client.complete({ system: 's', user: 'u' }), /401/);
  assert.equal(n, 1);
});
