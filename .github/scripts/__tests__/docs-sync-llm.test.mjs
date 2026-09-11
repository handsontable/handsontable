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
  // Omitted entirely, not sent as 0: a reasoning-tier model rejects any
  // non-default temperature, so the absent key is what lets the call through.
  assert.ok(!('temperature' in body), 'temperature is absent when not configured');
  assert.deepEqual(body.response_format, { type: 'json_object' });
  assert.deepEqual(body.messages, [{ role: 'system', content: 'S' }, { role: 'user', content: 'U' }]);
});

test('a configured temperature is sent verbatim, including 0', async() => {
  for (const temperature of [0, 0.7]) {
    const calls = [];
    const fetchImpl = async(url, init) => {
      calls.push(init);

      return ok('{}');
    };
    const client = createClient({
      baseUrl: 'https://x', apiKey: 'k', model: 'm', temperature, fetchImpl, sleep: noSleep,
    });

    await client.complete({ system: 's', user: 'u' });

    assert.equal(JSON.parse(calls[0].body).temperature, temperature);
  }
});

test('an error body is surfaced past 200 characters and capped at 4096', async() => {
  const shortTail = `${'x'.repeat(300)}NEEDLE`;
  const fetchImpl = async() => new Response(shortTail, { status: 400 });
  const client = createClient({ baseUrl: 'https://x', apiKey: 'k', model: 'm', fetchImpl, sleep: noSleep });

  // The old 200-character cut buried the actual cause; the wider cut keeps it.
  await assert.rejects(() => client.complete({ system: 's', user: 'u' }), /NEEDLE/);

  const longBody = 'y'.repeat(5000);
  const fetchLong = async() => new Response(longBody, { status: 400 });
  const clientLong = createClient({ baseUrl: 'https://x', apiKey: 'k', model: 'm', fetchImpl: fetchLong, sleep: noSleep });

  await assert.rejects(() => clientLong.complete({ system: 's', user: 'u' }), (error) => {
    const quoted = error.message.slice(error.message.indexOf('400: ') + '400: '.length);

    assert.equal(quoted.length, 4096, 'the body is capped at 4096 characters');

    return true;
  });
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

test('the fetch call carries an abort signal, and a timeout is retried like a network error', async() => {
  const calls = [];
  let n = 0;
  const fetchImpl = async(url, init) => {
    calls.push(init);
    n += 1;
    if (n === 1) {
      const error = new Error('The operation was aborted due to timeout');

      error.name = 'TimeoutError';
      throw error;
    }

    return ok('fine');
  };
  const client = createClient({
    baseUrl: 'https://x', apiKey: 'k', model: 'm', fetchImpl, sleep: noSleep, timeoutMs: 5,
  });

  assert.equal(await client.complete({ system: 's', user: 'u' }), 'fine');
  assert.equal(n, 2);
  assert.ok(calls[0].signal instanceof AbortSignal);
});
