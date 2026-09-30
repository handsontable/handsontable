import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJevClient, JevInputTooLargeError, systemOneUrl } from '../lib/breaking-check/jev.mjs';

const noSleep = async() => {};
const ok = (answers, usage = { input_tokens: 10, output_tokens: 2 }) => new Response(
  JSON.stringify({ model: 'jev-latest', answers, usage }),
  { status: 200 },
);

test('systemOneUrl joins with exactly one slash, with or without a trailing slash on the base', () => {
  assert.equal(systemOneUrl('https://llm.example.com'), 'https://llm.example.com/typesafe/v1/systemone');
  assert.equal(systemOneUrl('https://llm.example.com/'), 'https://llm.example.com/typesafe/v1/systemone');
  assert.equal(systemOneUrl('https://llm.example.com//'), 'https://llm.example.com/typesafe/v1/systemone');
});

test('ask posts model/state/questions and returns answers + usage', async() => {
  const calls = [];
  const fetchImpl = async(url, init) => {
    calls.push({ url, init });

    return ok({ q1: { type: 'noul', noul: 0.9 } });
  };
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', fetchImpl, sleep: noSleep,
  });

  const result = await client.ask({ diff: 'd' }, { q1: { type: 'noul', instructions: 'i' } });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://x/typesafe/v1/systemone');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer k');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');

  const body = JSON.parse(calls[0].init.body);

  assert.equal(body.model, 'jev-latest');
  assert.deepEqual(body.state, { diff: 'd' });
  assert.deepEqual(body.questions, { q1: { type: 'noul', instructions: 'i' } });
  assert.deepEqual(result.answers, { q1: { type: 'noul', noul: 0.9 } });
  assert.deepEqual(result.usage, { input_tokens: 10, output_tokens: 2 });
});

test('a custom model name is sent verbatim', async() => {
  const bodies = [];
  const fetchImpl = async(url, init) => {
    bodies.push(JSON.parse(init.body));

    return ok({});
  };
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', model: 'jev-2024', fetchImpl, sleep: noSleep,
  });

  await client.ask({}, {});

  assert.equal(bodies[0].model, 'jev-2024');
});

test('429 is retried with backoff, then a later success wins', async() => {
  let n = 0;
  const sleeps = [];
  const fetchImpl = async() => {
    n += 1;
    if (n < 3) {
      return new Response('busy', { status: 429 });
    }

    return ok({ q: { type: 'noul', noul: 0.1 } });
  };
  const client = createJevClient({
    baseUrl: 'https://x',
    apiKey: 'k',
    fetchImpl,
    sleep: async(ms) => { sleeps.push(ms); },
    attempts: 3,
  });

  const result = await client.ask({}, {});

  assert.equal(n, 3);
  assert.deepEqual(sleeps, [1000, 2000]);
  assert.deepEqual(result.answers, { q: { type: 'noul', noul: 0.1 } });
});

test('529 (overloaded) is retried like a 5xx', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;

    return n === 1 ? new Response('overloaded', { status: 529 }) : ok({});
  };
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', fetchImpl, sleep: noSleep,
  });

  await client.ask({}, {});
  assert.equal(n, 2);
});

test('a 400 carrying max_tokens_exceeded throws JevInputTooLargeError and is never retried', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;

    return new Response(JSON.stringify({ error: { code: 'max_tokens_exceeded', message: 'too big' } }), { status: 400 });
  };
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', fetchImpl, sleep: noSleep, attempts: 3,
  });

  await assert.rejects(() => client.ask({}, {}), (error) => {
    assert.ok(error instanceof JevInputTooLargeError);
    assert.match(error.message, /max_tokens_exceeded/);

    return true;
  });
  assert.equal(n, 1, 'not retried');
});

test('a plain 400 with no max_tokens_exceeded marker is a normal, non-retried error', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;

    return new Response('bad request', { status: 400 });
  };
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', fetchImpl, sleep: noSleep,
  });

  await assert.rejects(() => client.ask({}, {}), (error) => {
    assert.ok(!(error instanceof JevInputTooLargeError));
    assert.match(error.message, /400/);

    return true;
  });
  assert.equal(n, 1);
});

test('401 is not retried', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;

    return new Response('unauthorized', { status: 401 });
  };
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', fetchImpl, sleep: noSleep, attempts: 3,
  });

  await assert.rejects(() => client.ask({}, {}), /401/);
  assert.equal(n, 1);
});

test('422 is not retried', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;

    return new Response('unprocessable', { status: 422 });
  };
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', fetchImpl, sleep: noSleep, attempts: 3,
  });

  await assert.rejects(() => client.ask({}, {}), /422/);
  assert.equal(n, 1);
});

test('a network error is retried and a later success wins', async() => {
  let n = 0;
  const fetchImpl = async() => {
    n += 1;
    if (n === 1) {
      throw new Error('ECONNRESET');
    }

    return ok({});
  };
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', fetchImpl, sleep: noSleep,
  });

  await client.ask({}, {});
  assert.equal(n, 2);
});

test('a response with no answers object throws', async() => {
  const fetchImpl = async() => new Response(JSON.stringify({ model: 'jev-latest' }), { status: 200 });
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'k', fetchImpl, sleep: noSleep,
  });

  await assert.rejects(() => client.ask({}, {}), /no answers/);
});

test('the API key never appears in a thrown error message', async() => {
  const fetchImpl = async() => new Response('server error body', { status: 500 });
  const client = createJevClient({
    baseUrl: 'https://x', apiKey: 'super-secret-key', fetchImpl, sleep: noSleep, attempts: 1,
  });

  await assert.rejects(() => client.ask({}, {}), (error) => {
    assert.doesNotMatch(error.message, /super-secret-key/);

    return true;
  });
});
