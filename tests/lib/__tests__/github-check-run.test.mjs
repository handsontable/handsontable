import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listCheckRuns, postCheckRun } from '../github-check-run.mjs';

const payload = annotations => ({ name: 'Screen reader / nvda-chromium report', conclusion: 'neutral', title: 't', summary: 's', annotations });
const annotation = index => ({ path: 'tests/x.json', start_line: index, end_line: index, annotation_level: 'warning', title: 'a', message: 'm' });

/**
 * A fetch that records every request and answers with a created check run.
 *
 * @param {object[]} calls Where the requests go.
 * @param {boolean} [ok] Whether the response is ok.
 * @returns {Function} The fake fetch.
 */
function fakeFetch(calls, ok = true) {
  return async(url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: JSON.parse(init.body) });

    return { ok, status: ok ? 201 : 403, json: async() => ({ id: 42, html_url: 'https://github.com/o/r/runs/42' }), text: async() => 'forbidden' };
  };
}

test('one POST creates the check run with the first fifty annotations, and a PATCH adds each further batch', async() => {
  const calls = [];
  const created = await postCheckRun({
    token: 'tok', repository: 'o/r', headSha: 'abc', payload: payload(Array.from({ length: 120 }, (_, index) => annotation(index + 1))),
    detailsUrl: 'https://github.com/o/r/actions/runs/1', fetchImpl: fakeFetch(calls),
  });

  assert.deepEqual(created, { id: 42, html_url: 'https://github.com/o/r/runs/42' });
  assert.deepEqual(calls.map(call => [call.method, call.url, call.body.output.annotations.length]), [
    ['POST', 'https://api.github.com/repos/o/r/check-runs', 50],
    ['PATCH', 'https://api.github.com/repos/o/r/check-runs/42', 50],
    ['PATCH', 'https://api.github.com/repos/o/r/check-runs/42', 20],
  ]);
  assert.equal(calls[0].headers.Authorization, 'Bearer tok');
  assert.equal(calls[0].body.head_sha, 'abc');
  assert.equal(calls[0].body.status, 'completed');
  assert.equal(calls[0].body.conclusion, 'neutral');
  assert.equal(calls[0].body.details_url, 'https://github.com/o/r/actions/runs/1');
  assert.deepEqual(Object.keys(calls[1].body), ['output']);
});

test('no annotations is one POST with an empty list, on the API root given', async() => {
  const calls = [];

  await postCheckRun({ token: 't', repository: 'o/r', headSha: 'abc', payload: payload([]), apiUrl: 'https://ghe.example/api/v3', fetchImpl: fakeFetch(calls) });
  assert.deepEqual(calls.map(call => [call.method, call.url, call.body.output.annotations.length]), [['POST', 'https://ghe.example/api/v3/repos/o/r/check-runs', 0]]);
  assert.equal('details_url' in calls[0].body, false);
});

test('a PATCH that fails after the POST created the check run throws with the PATCH and its status', async() => {
  const calls = [];
  const created = fakeFetch(calls);
  const failed = fakeFetch(calls, false);

  await assert.rejects(
    postCheckRun({
      token: 't', repository: 'o/r', headSha: 'abc', payload: payload(Array.from({ length: 60 }, (_, index) => annotation(index + 1))),
      fetchImpl: (url, init) => (calls.length === 0 ? created(url, init) : failed(url, init)),
    }),
    /^Error: PATCH https:\/\/api\.github\.com\/repos\/o\/r\/check-runs\/42 answered 403: forbidden$/,
  );
  assert.deepEqual(calls.map(call => [call.method, call.body.output.annotations.length]), [['POST', 50], ['PATCH', 10]],
    'the check run exists with its first fifty annotations; the batch after it is the one that failed');
});

test('an error status throws with the method, the URL, the status and the body', async() => {
  await assert.rejects(
    postCheckRun({ token: 't', repository: 'o/r', headSha: 'abc', payload: payload([]), fetchImpl: fakeFetch([], false) }),
    /^Error: POST https:\/\/api\.github\.com\/repos\/o\/r\/check-runs answered 403: forbidden$/,
  );
});

test('a check run carries the run that posted it as its external id, so the run verdict reads only its own', async() => {
  const calls = [];

  await postCheckRun({ token: 't', repository: 'o/r', headSha: 'abc', payload: payload([]), externalId: '4242', fetchImpl: fakeFetch(calls) });
  assert.equal(calls[0].body.external_id, '4242');

  const without = [];

  await postCheckRun({ token: 't', repository: 'o/r', headSha: 'abc', payload: payload([]), fetchImpl: fakeFetch(without) });
  assert.equal('external_id' in without[0].body, false);
});

test('listCheckRuns pages through every check run of a commit until a page is short', async() => {
  const calls = [];
  const page = (count, from) => Array.from({ length: count }, (_, index) => ({ id: from + index, name: `run ${from + index}` }));
  const pages = [page(100, 0), page(100, 100), page(3, 200)];
  const runs = await listCheckRuns({
    token: 'tok', repository: 'o/r', sha: 'abc',
    fetchImpl: async(url, init) => {
      calls.push({ url, method: init.method, auth: init.headers.Authorization });

      return { ok: true, status: 200, json: async() => ({ total_count: 203, check_runs: pages[calls.length - 1] }), text: async() => '' };
    },
  });

  assert.equal(runs.length, 203);
  assert.deepEqual(calls.map(call => call.url), [1, 2, 3].map(number => `https://api.github.com/repos/o/r/commits/abc/check-runs?filter=all&per_page=100&page=${number}`));
  assert.deepEqual(calls.map(call => [call.method, call.auth]), Array(3).fill(['GET', 'Bearer tok']));
});

test('listCheckRuns throws on an error status, never reads it as no check run', async() => {
  await assert.rejects(
    listCheckRuns({ token: 't', repository: 'o/r', sha: 'abc', fetchImpl: async() => ({ ok: false, status: 403, text: async() => 'forbidden' }) }),
    /^Error: GET https:\/\/api\.github\.com\/repos\/o\/r\/commits\/abc\/check-runs\?filter=all&per_page=100&page=1 answered 403: forbidden$/,
  );
});
