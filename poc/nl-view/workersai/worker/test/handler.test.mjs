/**
 * Local tests for routing, auth, CORS, the daily cap, and request shaping.
 * The AI double records the payload and returns canned JSON. It is not a model.
 * LOCAL_AI_STUB tests assert env.AI.run is never called.
 * Do not treat any number from this file as a benchmark.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { handleRequest } from '../src/index.js';
import { costUsd, DEFAULT_MODEL, FAST_MODEL } from '../src/pricing.js';

const TOKEN = 'test-token-not-a-secret';

function memoryKv() {
  const store = new Map();

  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, String(value));
    },
  };
}

function env(overrides = {}) {
  return {
    POC_TOKEN: TOKEN,
    DAILY_CAP: '10',
    'poc-nl-view-workersai-kv': memoryKv(),
    AI: {
      async run() {
        throw new Error('AI.run should not have been called');
      },
    },
    ...overrides,
  };
}

function post(body, token = TOKEN) {
  return new Request('https://worker.test/translate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token == null ? {} : { 'x-poc-token': token }),
    },
    body: JSON.stringify(body),
  });
}

const context = {
  columns: [
    {
      prop: 'status',
      inferredType: 'text',
      conditions: [{ name: 'eq', inputsCount: 1 }],
      sampleValues: ['paid', 'pending'],
    },
  ],
  currentState: { version: 1, filters: [], sort: { columns: [] }, hiddenColumns: [] },
};

test('GET /health is open and lists the allowlist', async () => {
  const response = await handleRequest(new Request('https://worker.test/health'), env());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.deepEqual(body.models, [DEFAULT_MODEL, FAST_MODEL]);
});

test('OPTIONS /translate answers CORS without a token', async () => {
  const response = await handleRequest(new Request('https://worker.test/translate', {
    method: 'OPTIONS',
    headers: { origin: 'http://localhost:8123', 'access-control-request-headers': 'x-poc-token, content-type' },
  }), env());

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.match(response.headers.get('access-control-allow-headers'), /x-poc-token/);
});

test('POST /translate without the token is 401 and does not call AI', async () => {
  let called = false;
  const response = await handleRequest(post({ prompt: 'paid', context }, null), env({
    AI: { async run() { called = true; } },
  }));

  assert.equal(response.status, 401);
  assert.equal(called, false);
  assert.equal(JSON.stringify(await response.json()).includes(TOKEN), false);
});

test('a wrong token is 401', async () => {
  const response = await handleRequest(post({ prompt: 'paid', context }, 'nope'), env());

  assert.equal(response.status, 401);
});

test('an unknown model is 400 and does not call AI', async () => {
  let called = false;
  const response = await handleRequest(post({
    prompt: 'paid',
    model: '@cf/meta/llama-3.1-8b-instruct',
    context,
  }), env({
    AI: { async run() { called = true; return {}; } },
  }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, 'unknown_model');
  assert.equal(called, false);
});

test('LOCAL_AI_STUB does not call env.AI', async () => {
  let called = false;
  const response = await handleRequest(post({ prompt: 'paid orders', today: '2026-10-20', context }), env({
    LOCAL_AI_STUB: '1',
    AI: { async run() { called = true; return {}; } },
  }));
  const body = await response.json();

  assert.equal(response.status, 501);
  assert.equal(body.model, 'local-stub');
  assert.equal(body.error, 'local_stub');
  assert.equal(called, false);
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'usage'), false);
});

test('the AI double receives guided JSON built from posted conditions', async () => {
  const seen = [];
  const response = await handleRequest(post({
    prompt: 'only paid',
    model: '8b',
    today: '2026-10-20',
    context,
  }), env({
    AI: {
      async run(model, input) {
        seen.push({ model, input });
        return {
          response: {
            not_expressible: false,
            reason: '',
            explanation: 'Paid only.',
            state: {
              version: 1,
              filters: [{ column: 'status', operation: 'conjunction', conditions: [{ name: 'eq', args: ['paid'] }] }],
              sort: { columns: [] },
              hiddenColumns: [],
            },
          },
          usage: { prompt_tokens: 1000, completion_tokens: 200, total_tokens: 1200 },
        };
      },
    },
  }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.model, FAST_MODEL);
  assert.equal(body.explanation, 'Paid only.');
  assert.equal(body.state.filters[0].conditions[0].name, 'eq');
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'costUsd'), false);
  assert.deepEqual(body.usage, { prompt_tokens: 1000, completion_tokens: 200, total_tokens: 1200 });
  assert.equal(seen[0].model, FAST_MODEL);
  assert.equal(seen[0].input.response_format.type, 'json_schema');
  const names = seen[0].input.response_format.json_schema.properties.state.properties.filters.items.properties.conditions.items.properties.name.enum;

  assert.deepEqual(names.sort(), ['by_value', 'eq']);
  assert.equal(seen[0].input.messages[1].content.includes('only paid'), true);
  assert.equal(seen[0].input.messages[1].content.includes('contains('), false);
});

test('not_expressible is passed through with usage', async () => {
  const response = await handleRequest(post({ prompt: 'group by status', context }), env({
    AI: {
      async run() {
        return {
          response: { not_expressible: true, reason: 'Grouping is not a view state.', explanation: '', state: { version: 1, filters: [], sort: { columns: [] }, hiddenColumns: [] } },
          usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
        };
      },
    },
  }));
  const body = await response.json();

  assert.equal(body.not_expressible, true);
  assert.match(body.reason, /Grouping/);
  assert.equal(body.usage.total_tokens, 18);
});

test('the daily cap stops a second call before AI.run', async () => {
  let calls = 0;
  const shared = env({
    DAILY_CAP: '1',
    AI: {
      async run() {
        calls += 1;
        return {
          response: { not_expressible: true, reason: 'no', explanation: '', state: { version: 1, filters: [], sort: { columns: [] }, hiddenColumns: [] } },
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        };
      },
    },
  });
  const first = await handleRequest(post({ prompt: 'one', context }), shared);
  const second = await handleRequest(post({ prompt: 'two', context }), shared);

  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
  assert.equal(calls, 1);
});

test('missing usage stays null instead of a fake zero', async () => {
  const response = await handleRequest(post({ prompt: 'paid', context }), env({
    AI: {
      async run() {
        return { response: { not_expressible: true, reason: 'no', state: { version: 1, filters: [], sort: { columns: [] }, hiddenColumns: [] } } };
      },
    },
  }));
  const body = await response.json();

  assert.equal(body.usage, null);
});

test('costUsd follows the neuron formula', () => {
  const millionIn = costUsd(DEFAULT_MODEL, { prompt_tokens: 1_000_000, completion_tokens: 0 });
  const millionOut = costUsd(FAST_MODEL, { prompt_tokens: 0, completion_tokens: 1_000_000 });

  assert.ok(Math.abs(millionIn - (26668 / 1000) * 0.011) < 1e-12);
  assert.ok(Math.abs(millionOut - (34868 / 1000) * 0.011) < 1e-12);
  assert.equal(costUsd(DEFAULT_MODEL, null), null);
});

test('wrangler.toml has the account, the placeholder KV id, and no token or stub flag', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

  assert.match(toml, /name = "poc-nl-view-workersai"/);
  assert.match(toml, /account_id = "e17e41cc82bda15dfa63960aa172fb87"/);
  assert.match(toml, /binding = "AI"/);
  assert.match(toml, /binding = "poc-nl-view-workersai-kv"/);
  assert.match(toml, /id = "REPLACE_ME"/);
  assert.equal(/POC_TOKEN\s*=/.test(toml), false);
  assert.equal(toml.includes('LOCAL_AI_STUB'), false);
});
