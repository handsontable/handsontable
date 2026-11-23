import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  GRAPHQL_URL,
  MIN_DOCS_VERSION,
  RELEASES_URL,
  buildVersionList,
  createCommonJsonHooks,
  fetchReleaseTags,
  groupReleaseTags,
  resolveReleaseVersions,
  toMinor,
} from '../docs-versions.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..');

const noSleep = async() => {};

/**
 * Builds a `fetch` double that answers each call with the next entry. The last
 * entry answers every later call.
 *
 * @param {Array<{ status?: number, body?: unknown, error?: Error }>} answers The answers, in call order.
 * @returns {{ fetchImpl: typeof fetch, calls: Array<{ url: string, options: any }> }} The double and its call log.
 */
function fakeFetch(answers) {
  const calls = [];
  const fetchImpl = async(url, options) => {
    calls.push({ url, options });

    const answer = answers[Math.min(calls.length - 1, answers.length - 1)];

    if (answer.error) {
      throw answer.error;
    }

    const status = answer.status ?? 200;

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async() => answer.body,
    };
  };

  return { fetchImpl, calls };
}

const restBody = (...tags) => tags.map((tag_name) => ({ tag_name }));
const graphqlPage = (tags, next = null) => ({
  data: {
    repository: {
      releases: {
        nodes: tags.map((tagName) => ({ tagName })),
        pageInfo: { hasNextPage: next !== null, endCursor: next },
      },
    },
  },
});
const graphqlBody = (...tags) => graphqlPage(tags);

// The tags a healthy history holds: stable minors down to the floor and a prerelease on top.
const HEALTHY_TAGS = ['19.0.0-rc5', '18.1.3', '18.1.2', '18.0.0', '17.1.0', '10.0.0', '9.0.1', '9.0.0', '8.4.0'];

test('toMinor returns the minor line, or null for an invalid version', () => {
  assert.equal(toMinor('17.0.1'), '17.0');
  assert.equal(toMinor('not-a-version'), null);
});

test('groupReleaseTags drops prereleases and groups patches newest first', () => {
  const { minors, minorMap } = groupReleaseTags([
    '19.0.0-rc5', '18.1.1', '18.1.3', '18.1.3-rc1', '18.1.2', '18.0.0', 'nightly',
  ]);

  assert.deepEqual(minors, ['18.1', '18.0']);
  assert.deepEqual(minorMap.get('18.1'), ['18.1.3', '18.1.2', '18.1.1']);
  assert.deepEqual(minorMap.get('18.0'), ['18.0.0']);
});

test('groupReleaseTags sorts minors numerically and stops at the floor', () => {
  const { minors } = groupReleaseTags(['9.0.0', '10.0.0', '8.4.0', '17.1.0', '17.0.0', '2.0.0']);

  assert.deepEqual(minors, ['17.1', '17.0', '10.0', '9.0']);
});

test('fetchReleaseTags without a token sends an anonymous REST request with a timeout', async() => {
  const { fetchImpl, calls } = fakeFetch([{ body: restBody('18.1.0') }]);
  const tags = await fetchReleaseTags({ fetchImpl, sleep: noSleep });

  assert.deepEqual(tags, ['18.1.0']);
  assert.equal(calls[0].url, RELEASES_URL);
  assert.equal('Authorization' in calls[0].options.headers, false);
  assert.equal(calls[0].options.method, undefined);
  assert.ok(calls[0].options.signal instanceof AbortSignal);
});

test('fetchReleaseTags with a token sends an authenticated GraphQL request', async() => {
  const { fetchImpl, calls } = fakeFetch([{ body: graphqlBody('18.1.0', '18.0.0') }]);
  const tags = await fetchReleaseTags({ token: 'secret', fetchImpl, sleep: noSleep });

  assert.deepEqual(tags, ['18.1.0', '18.0.0']);
  assert.equal(calls[0].url, GRAPHQL_URL);
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer secret');
  assert.match(JSON.parse(calls[0].options.body).query, /releases\(first: 100/);
  assert.ok(calls[0].options.signal instanceof AbortSignal);
});

test('fetchReleaseTags with a token reads the next page until the list covers the floor', async() => {
  const { fetchImpl, calls } = fakeFetch([
    { body: graphqlPage(['19.0.0-rc5', '18.1.3', '17.1.0'], 'cursor-1') },
    { body: graphqlPage(['10.0.0', '9.0.1', '9.0.0'], 'cursor-2') },
    { body: graphqlPage(['8.4.0', '8.3.0'], 'cursor-3') },
  ]);
  const tags = await fetchReleaseTags({ token: 'secret', fetchImpl, sleep: noSleep });

  assert.deepEqual(tags, ['19.0.0-rc5', '18.1.3', '17.1.0', '10.0.0', '9.0.1', '9.0.0', '8.4.0', '8.3.0']);
  assert.equal(calls.length, 3);
  assert.equal(JSON.parse(calls[0].options.body).variables.after, null);
  assert.equal(JSON.parse(calls[1].options.body).variables.after, 'cursor-1');
  assert.equal(JSON.parse(calls[2].options.body).variables.after, 'cursor-2');
});

test('fetchReleaseTags with a token stops at the first page that ends below the floor', async() => {
  const { fetchImpl, calls } = fakeFetch([{ body: graphqlPage(HEALTHY_TAGS, 'cursor-1') }]);
  const tags = await fetchReleaseTags({ token: 'secret', fetchImpl, sleep: noSleep });

  assert.deepEqual(tags, HEALTHY_TAGS);
  assert.equal(calls.length, 1);
});

test('fetchReleaseTags keeps paging when a page boundary falls inside the floor minor', async() => {
  const { fetchImpl, calls } = fakeFetch([
    { body: graphqlPage(['18.1.3', '10.0.0', '9.0.2'], 'cursor-1') },
    { body: graphqlPage(['9.0.1', '9.0.0', '8.4.0'], 'cursor-2') },
  ]);
  const { minors, minorMap } = await resolveReleaseVersions({
    token: 'secret',
    fetchImpl,
    sleep: noSleep,
    requireFloor: true,
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(minors.at(-1), '9.0');
  assert.deepEqual(minorMap.get('9.0'), ['9.0.2', '9.0.1', '9.0.0']);
});

test('fetchReleaseTags with a token stops at maxPages and at the last page', async() => {
  const endless = fakeFetch([{ body: graphqlPage(['18.1.3'], 'more') }]);
  const tags = await fetchReleaseTags({ token: 'secret', fetchImpl: endless.fetchImpl, maxPages: 3, sleep: noSleep });

  assert.equal(endless.calls.length, 3);
  assert.equal(tags.length, 3);

  const lastPage = fakeFetch([{ body: graphqlPage(['18.1.3']) }]);

  await fetchReleaseTags({ token: 'secret', fetchImpl: lastPage.fetchImpl, sleep: noSleep });
  assert.equal(lastPage.calls.length, 1);
});

test('fetchReleaseTags does not page the anonymous request', async() => {
  const { fetchImpl, calls } = fakeFetch([{ body: restBody('18.1.3') }]);

  await fetchReleaseTags({ fetchImpl, sleep: noSleep });

  assert.equal(calls.length, 1);
});

test('fetchReleaseTags retries a refused or dropped request and recovers', async() => {
  const { fetchImpl, calls } = fakeFetch([
    { status: 403 },
    { error: new Error('Premature close') },
    { body: restBody('18.1.0') },
  ]);
  const waits = [];
  const tags = await fetchReleaseTags({
    fetchImpl,
    delayMs: 10,
    sleep: async(ms) => { waits.push(ms); },
  });

  assert.deepEqual(tags, ['18.1.0']);
  assert.equal(calls.length, 3);
  assert.deepEqual(waits, [10, 20]);
});

test('fetchReleaseTags throws the status once every attempt is refused', async() => {
  const anonymous = fakeFetch([{ status: 403 }]);

  await assert.rejects(
    fetchReleaseTags({ fetchImpl: anonymous.fetchImpl, sleep: noSleep }),
    /answered 403.*no GITHUB_TOKEN was set/,
  );
  assert.equal(anonymous.calls.length, 5);

  const authenticated = fakeFetch([{ status: 502 }]);

  await assert.rejects(
    fetchReleaseTags({ token: 'secret', fetchImpl: authenticated.fetchImpl, sleep: noSleep }),
    (error) => /GraphQL API answered 502/.test(error.message) && !/no GITHUB_TOKEN/.test(error.message),
  );
});

test('fetchReleaseTags does not retry a rejected token', async() => {
  const { fetchImpl, calls } = fakeFetch([{ status: 401 }]);

  await assert.rejects(
    fetchReleaseTags({ token: 'stale', fetchImpl, sleep: noSleep }),
    /rejected GITHUB_TOKEN \(401\)/,
  );
  assert.equal(calls.length, 1);
});

test('fetchReleaseTags throws on a GraphQL error body and on an empty list', async() => {
  const errored = fakeFetch([{ body: { errors: [{ message: 'Bad credentials' }] } }]);

  await assert.rejects(
    fetchReleaseTags({ token: 'secret', fetchImpl: errored.fetchImpl, attempts: 1 }),
    /Bad credentials/,
  );

  const emptyRest = fakeFetch([{ body: [] }]);

  await assert.rejects(fetchReleaseTags({ fetchImpl: emptyRest.fetchImpl, attempts: 1 }), /no releases/);

  const emptyGraphql = fakeFetch([{ body: graphqlBody() }]);

  await assert.rejects(
    fetchReleaseTags({ token: 'secret', fetchImpl: emptyGraphql.fetchImpl, attempts: 1 }),
    /no releases/,
  );
});

test('resolveReleaseVersions throws when no release is stable', async() => {
  const { fetchImpl } = fakeFetch([{ body: restBody('19.0.0-rc5', '19.0.0-rc4') }]);

  await assert.rejects(resolveReleaseVersions({ fetchImpl, attempts: 1 }), /no stable version/);
});

test('resolveReleaseVersions with requireFloor rejects a list that never reaches the floor', async() => {
  const { fetchImpl } = fakeFetch([{ body: restBody('18.1.3', '18.0.0', '17.1.0') }]);

  await assert.rejects(
    resolveReleaseVersions({ fetchImpl, attempts: 1, requireFloor: true }),
    new RegExp(`ends at 17\\.1 and never reaches ${MIN_DOCS_VERSION.replace('.', '\\.')}`),
  );

  const { minors } = await resolveReleaseVersions({ fetchImpl, attempts: 1 });

  assert.deepEqual(minors, ['18.1', '18.0', '17.1']);
});

test('buildVersionList merges the local version into the release history', async() => {
  const { fetchImpl } = fakeFetch([{ body: restBody(...HEALTHY_TAGS) }]);
  const { minors, minorMap } = await buildVersionList({
    localPatch: '18.1.3',
    isProduction: true,
    fetchImpl,
    attempts: 1,
  });

  assert.deepEqual(minors, ['18.1', '18.0', '17.1', '10.0', '9.0']);
  assert.deepEqual(minorMap.get('18.1'), ['18.1.3', '18.1.2']);
  assert.deepEqual(minorMap.get('9.0'), ['9.0.1', '9.0.0']);
});

test('buildVersionList keeps a local minor that GitHub does not hold yet', async() => {
  const { fetchImpl } = fakeFetch([{ body: restBody(...HEALTHY_TAGS) }]);
  const { minors, minorMap } = await buildVersionList({
    localPatch: '19.0.0-rc5',
    isProduction: true,
    fetchImpl,
    attempts: 1,
  });

  assert.equal(minors[0], '19.0');
  assert.deepEqual(minorMap.get('19.0'), ['19.0.0-rc5']);
  assert.equal(minors[1], '18.1');
});

test('buildVersionList on a production build throws when the list cannot be read', async() => {
  const { fetchImpl } = fakeFetch([{ status: 403 }]);
  const warnings = [];

  await assert.rejects(
    buildVersionList({
      localPatch: '18.1.3',
      isProduction: true,
      fetchImpl,
      sleep: noSleep,
      warn: (message) => warnings.push(message),
    }),
    (error) => /Cannot write data\/common\.json: .*403/.test(error.message) && /403/.test(error.cause.message),
  );
  assert.deepEqual(warnings, []);
});

test('buildVersionList on a production build throws when the list is truncated', async() => {
  const { fetchImpl } = fakeFetch([{ body: restBody('18.1.3', '18.0.0') }]);

  await assert.rejects(
    buildVersionList({ localPatch: '18.1.3', isProduction: true, fetchImpl, attempts: 1 }),
    /Cannot write data\/common\.json: .*truncated/,
  );
});

test('buildVersionList on another build warns and keeps the local version only', async() => {
  const { fetchImpl } = fakeFetch([{ status: 403 }]);
  const warnings = [];
  const { minors, minorMap } = await buildVersionList({
    localPatch: '18.1.3',
    isProduction: false,
    fetchImpl,
    sleep: noSleep,
    warn: (message) => warnings.push(message),
  });

  assert.deepEqual(minors, ['18.1']);
  assert.deepEqual(minorMap.get('18.1'), ['18.1.3']);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /\[common-json\] Release list unavailable.*403/);
});

test('buildVersionList on another build accepts a list that stops above the floor', async() => {
  const { fetchImpl } = fakeFetch([{ body: restBody('18.1.3', '18.0.0') }]);
  const { minors } = await buildVersionList({
    localPatch: '18.1.3',
    isProduction: false,
    fetchImpl,
    attempts: 1,
    warn: () => {},
  });

  assert.deepEqual(minors, ['18.1', '18.0']);
});

test('the floor matches the oldest major the worker deploys', () => {
  const worker = readFileSync(resolve(repoRoot, 'docs/cloudflare/_worker.js'), 'utf8');
  const [major] = MIN_DOCS_VERSION.split('.');

  assert.match(worker, new RegExp(`const OLDEST_DEPLOYED_DOCS_MAJOR = ${major};`));
});

test('every workflow that builds the docs passes GITHUB_TOKEN to the build step', () => {
  const cases = [
    ['.github/workflows/docs-production.yml', '- name: Docker build'],
    ['.github/workflows/docs-staging.yml', '- name: Build docs (for staging preview)'],
    ['.github/workflows/docs-visual-tests.yml', '- name: Build documentation'],
  ];

  for (const [file, stepHeader] of cases) {
    const text = readFileSync(resolve(repoRoot, file), 'utf8');
    const start = text.indexOf(stepHeader);

    assert.notEqual(start, -1, `${file} has no "${stepHeader}" step`);

    const next = text.indexOf('\n      - ', start + stepHeader.length);
    const step = text.slice(start, next === -1 ? undefined : next);

    // Anchored to the line start, so a commented-out line does not count.
    assert.match(
      step,
      /^\s*GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}\s*$/m,
      `${file}: the "${stepHeader}" step must set GITHUB_TOKEN, or the release-list request is anonymous (DEV-4146)`,
    );
  }
});

test('the build-done hook awaits the write, so a failed write fails the build', async() => {
  const calls = [];
  const failure = new Error('Cannot write data/common.json');
  const hooks = createCommonJsonHooks(async(outDir, distDir) => {
    calls.push([outDir, distDir]);
    throw failure;
  });

  await assert.rejects(hooks['astro:build:done']({ dir: new URL('file:///tmp/dist/') }), failure);
  assert.deepEqual(calls, [['/tmp/dist/', '/tmp/dist/']]);
});

test('the docs config hands the build mode and the token to buildVersionList and uses the hooks', () => {
  const config = readFileSync(resolve(repoRoot, 'docs/astro.config.mjs'), 'utf8');

  assert.match(
    config,
    /buildVersionList\(\{\s*localPatch,\s*isProduction,\s*token: process\.env\.GITHUB_TOKEN,?\s*\}\)/,
  );
  assert.match(config, /^\s*hooks: createCommonJsonHooks\(buildAndWrite\),$/m);
});
