import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIST_ATTEMPTS, describeRuns, listWorkflowRuns, runsAhead, waitForRunsAhead } from '../screenreader-queue.mjs';

// tests/AGENTS.md ("A11y: the audit and the proof runs"): one screen reader run at a time, on any ref. A person
// checks for a run in flight before a dispatch; the weekly schedule cannot, so its run waits for the earlier runs
// of the workflow before its build, and fails at a bound instead of starting a second run. A cron fires from the
// default branch only, so no branch run can prove this: these tests are the proof before the first firing.
// Plain `node --test`, no packages: the root `test:tooling` installs nothing.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = path.join(TESTS_ROOT, 'scripts/screenreader-wait.mjs');
const SELF = 5000;
const run = (id, status, event = 'workflow_dispatch', branch = 'feature/proof-run') => ({ id, status, event, head_branch: branch });

/**
 * A clock and a pause that share one time: a pause moves the clock and waits for nothing.
 *
 * @returns {{now: () => number, sleep: (ms: number) => Promise<void>, pauses: number[]}} The fakes.
 */
function fakeTime() {
  let time = 1_000_000;
  const pauses = [];

  return {
    now: () => time,
    sleep: async(ms) => {
      pauses.push(ms);
      time += ms;
    },
    pauses,
  };
}

/**
 * A list that answers with each entry in turn, then keeps answering with the last; an `Error` entry is thrown.
 *
 * @param {Array<object[]|Error>} answers The answers, in order.
 * @returns {() => Promise<object[]>} The fake list.
 */
function listOf(answers) {
  let read = 0;

  return async() => {
    const answer = answers[Math.min(read, answers.length - 1)];

    read += 1;
    if (answer instanceof Error) {
      throw answer;
    }

    return answer;
  };
}

test('runsAhead keeps the earlier runs that have not completed and can reach the lanes', () => {
  const runs = [
    run(6000, 'pending', 'workflow_dispatch', 'develop'),
    run(5500, 'in_progress'),
    run(SELF, 'in_progress', 'schedule', 'develop'),
    run(4900, 'queued'),
    run(4800, 'in_progress'),
    run(4700, 'pending'),
    run(4600, 'requested'),
    run(4500, 'completed'),
    run(4400, 'in_progress', 'pull_request'),
  ];

  assert.deepEqual(runsAhead(runs, SELF).map(entry => entry.id), [4900, 4800, 4700, 4600],
    'a run whose lanes wait for a macOS slot reads `queued` as a whole, so anything but `completed` is in flight');
  assert.deepEqual(runsAhead(runs, String(SELF)).map(entry => entry.id), [4900, 4800, 4700, 4600], 'GITHUB_RUN_ID is a string');
  assert.equal(runsAhead(runs, SELF).some(entry => entry.id === SELF), false, 'never itself');
  assert.equal(runsAhead(runs, SELF).some(entry => entry.id > SELF), false,
    'never a later run: a later develop run is queued behind this one by the concurrency group, so waiting for it would wait for itself, '
    + 'and a later branch run is its dispatcher\'s to hold back');
  assert.equal(runsAhead(runs, SELF).some(entry => entry.event === 'pull_request'), false,
    'never a pull request run: it validates the workflow file and skips every job');
  assert.deepEqual(runsAhead([], SELF), []);
  assert.deepEqual(runsAhead([{ id: '4900', status: 'queued', event: 'workflow_dispatch' }, { status: 'queued', event: 'workflow_dispatch' }], SELF), [],
    'a run without a numeric id is not compared');
  for (const id of [undefined, '', 'abc', 0, -1, 1.5]) {
    assert.throws(() => runsAhead(runs, id), /is not a positive integer, so no run can be told to be ahead of it$/,
      `a run id of ${JSON.stringify(id)} would read every run as later and start the lanes at once`);
  }
});

test('the wait ends at once when no run is ahead, and reads the list once', async() => {
  const time = fakeTime();
  const lines = [];
  const result = await waitForRunsAhead({ list: listOf([[run(4500, 'completed'), run(6000, 'queued')]]), runId: SELF, boundMs: 180 * 60_000, intervalMs: 60_000,
    sleep: time.sleep, now: time.now, log: line => lines.push(line) });

  assert.deepEqual(result, { free: true, waitedMs: 0, reads: 1, ahead: [] });
  assert.deepEqual(time.pauses, [], 'no pause: a week with no proof run in flight costs one request');
  assert.deepEqual(lines, []);
});

test('the wait reads the list once per interval until the earlier runs finish', async() => {
  const time = fakeTime();
  const lines = [];
  const result = await waitForRunsAhead({
    list: listOf([[run(4900, 'in_progress'), run(4800, 'queued')], [run(4900, 'in_progress'), run(4800, 'completed')], [run(4900, 'completed')]]),
    runId: SELF, boundMs: 180 * 60_000, intervalMs: 60_000, sleep: time.sleep, now: time.now, log: line => lines.push(line),
  });

  assert.deepEqual(result, { free: true, waitedMs: 120_000, reads: 3, ahead: [] });
  assert.deepEqual(time.pauses, [60_000, 60_000]);
  assert.deepEqual(lines, ['waiting for run 4900 and run 4800; 0 of 180 minutes', 'waiting for run 4900; 1 of 180 minutes']);
});

test('the wait stops at the bound with the runs still ahead, and never starts the lanes beside them', async() => {
  const time = fakeTime();
  const result = await waitForRunsAhead({ list: listOf([[run(4900, 'in_progress')]]), runId: SELF, boundMs: 180 * 60_000, intervalMs: 60_000,
    sleep: time.sleep, now: time.now });

  assert.equal(result.free, false);
  assert.equal(result.waitedMs, 180 * 60_000, 'the last read is at the bound');
  assert.deepEqual(result.ahead.map(entry => entry.id), [4900]);
  assert.equal(time.pauses.length, 180);
  assert.equal(result.reads, 181);
});

test('a read that fails is read again, and three in a row end the wait with the reason', async() => {
  const time = fakeTime();
  const lines = [];
  const lost = new Error('GET https://api.example/runs answered 502: bad gateway');
  const recovered = await waitForRunsAhead({ list: listOf([lost, lost, [run(4900, 'in_progress')], lost, []]), runId: SELF, boundMs: 180 * 60_000,
    intervalMs: 60_000, sleep: time.sleep, now: time.now, log: line => lines.push(line) });

  assert.deepEqual(recovered, { free: true, waitedMs: 240_000, reads: 5, ahead: [] });
  assert.deepEqual(lines, [
    'could not list the runs (GET https://api.example/runs answered 502: bad gateway); reading again',
    'could not list the runs (GET https://api.example/runs answered 502: bad gateway); reading again',
    'waiting for run 4900; 2 of 180 minutes',
    'could not list the runs (GET https://api.example/runs answered 502: bad gateway); reading again',
  ], 'a failed read is never read as free lanes, and a good read starts the count over');

  assert.equal(LIST_ATTEMPTS, 3);
  await assert.rejects(waitForRunsAhead({ list: listOf([new Error('GET https://api.example/runs answered 403: forbidden')]), runId: SELF,
    boundMs: 180 * 60_000, intervalMs: 60_000, sleep: fakeTime().sleep, now: fakeTime().now }),
  /^Error: the runs could not be listed 3 times in a row, so it is not known whether a screen reader run is in flight: GET https:\/\/api\.example\/runs answered 403: forbidden$/,
  'a token that cannot list runs ends the wait after three reads, not after the bound');

  // A failed read at the bound still ends the wait, with the runs of the last good read.
  const late = fakeTime();
  const atBound = await waitForRunsAhead({ list: listOf([[run(4900, 'in_progress')], lost]), runId: SELF, boundMs: 60_000, intervalMs: 60_000,
    sleep: late.sleep, now: late.now });

  assert.deepEqual([atBound.free, atBound.ahead.map(entry => entry.id)], [false, [4900]]);
});

test('listWorkflowRuns reads the newest hundred runs of the workflow, on every ref', async() => {
  const calls = [];
  const fetchImpl = async(url, init) => {
    calls.push({ url, method: init.method, headers: init.headers });

    return { ok: true, status: 200, json: async() => ({ total_count: 1, workflow_runs: [run(4900, 'queued')] }), text: async() => '' };
  };

  assert.deepEqual(await listWorkflowRuns({ token: 'tok', repository: 'o/r', workflow: 'screenreader-nightly.yml', fetchImpl }), [run(4900, 'queued')]);
  assert.deepEqual(calls.map(call => [call.method, call.url]),
    [['GET', 'https://api.github.com/repos/o/r/actions/workflows/screenreader-nightly.yml/runs?per_page=100']],
    'no branch, event or status filter: a proof run on any branch, queued or in progress, is in the list');
  assert.equal(calls[0].headers.Authorization, 'Bearer tok');

  await assert.rejects(listWorkflowRuns({ token: 't', repository: 'o/r', workflow: 'w.yml', apiUrl: 'https://ghe.example/api/v3',
    fetchImpl: async() => ({ ok: false, status: 403, text: async() => 'Resource not accessible by integration' }) }),
  /^Error: GET https:\/\/ghe\.example\/api\/v3\/repos\/o\/r\/actions\/workflows\/w\.yml\/runs\?per_page=100 answered 403: Resource not accessible by integration$/);
  await assert.rejects(listWorkflowRuns({ token: 't', repository: 'o/r', workflow: 'w.yml',
    fetchImpl: async() => ({ ok: true, status: 200, json: async() => ({ message: 'no runs here' }) }) }),
  /answered without a list of runs$/, 'an answer without a list is not read as no run in flight');
});

test('describeRuns names the runs by id', () => {
  assert.equal(describeRuns([run(4900, 'queued')]), 'run 4900');
  assert.equal(describeRuns([run(4900, 'queued'), run(4800, 'in_progress')]), 'run 4900 and run 4800');
  assert.equal(describeRuns([]), 'no run that could be read');
});

/**
 * Runs the wait script against a local server that answers the runs list with each answer in turn.
 *
 * @param {Array<{status: number, body: object}>} answers The answers, in order; the last one repeats.
 * @param {object} [options] The run.
 * @param {string[]} [options.args] The script's arguments.
 * @param {Record<string, string>} [options.env] Environment on top of the defaults.
 * @returns {Promise<{status: number, stdout: string, stderr: string, requests: string[], summary: string}>} The result.
 */
async function waitScript(answers, { args = ['--workflow', 'screenreader-nightly.yml', '--bound-minutes', '0.005', '--interval-seconds', '0.05'], env = {} } = {}) {
  const requests = [];
  const server = createServer((request, response) => {
    const answer = answers[Math.min(requests.length, answers.length - 1)];

    requests.push(`${request.method} ${request.url} ${request.headers.authorization}`);
    response.writeHead(answer.status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(answer.body));
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  const summaryFile = path.join(mkdtempSync(path.join(tmpdir(), 'screenreader-wait-')), 'summary.md');

  try {
    return await new Promise((resolve) => {
      execFile(process.execPath, [SCRIPT, ...args], {
        cwd: TESTS_ROOT,
        encoding: 'utf8',
        timeout: 30_000,
        env: { PATH: process.env.PATH, GITHUB_TOKEN: 'tok', GITHUB_REPOSITORY: 'o/r', GITHUB_RUN_ID: String(SELF),
          GITHUB_API_URL: `http://127.0.0.1:${server.address().port}`, GITHUB_STEP_SUMMARY: summaryFile, ...env },
      }, (error, stdout, stderr) => {
        let summary = '';

        try {
          summary = readFileSync(summaryFile, 'utf8');
        } catch {
          // No summary was written: the script appends to the file only when it waited.
        }
        resolve({ status: error ? error.code : 0, stdout, stderr, requests, summary });
      });
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('the wait script starts the lanes when no earlier run is in flight, and says so', async() => {
  const free = await waitScript([{ status: 200, body: { workflow_runs: [run(4500, 'completed'), run(6000, 'queued')] } }]);

  assert.equal(free.status, 0, free.stderr);
  assert.equal(free.stdout, 'screenreader-wait: no earlier screen reader run is in flight; the lanes can start\n');
  assert.deepEqual(free.requests, ['GET /repos/o/r/actions/workflows/screenreader-nightly.yml/runs?per_page=100 Bearer tok']);
  assert.equal(free.summary, '', 'nothing to say on the run page when it did not wait');
});

test('the wait script waits for an earlier run, then starts the lanes and notes the wait on the run page', async() => {
  const waited = await waitScript([
    { status: 200, body: { workflow_runs: [run(4900, 'queued')] } },
    { status: 200, body: { workflow_runs: [run(4900, 'completed')] } },
  ], { args: ['--workflow', 'screenreader-nightly.yml', '--bound-minutes', '1', '--interval-seconds', '0.05'] });

  assert.equal(waited.status, 0, waited.stderr);
  assert.match(waited.stdout, /^screenreader-wait: waiting for run 4900; 0 of 1 minutes\nscreenreader-wait: the earlier screen reader runs finished after 0 minutes; the lanes can start\n$/);
  assert.equal(waited.requests.length, 2);
  assert.match(waited.summary, /^The scheduled audit waited 0 minutes for an earlier screen reader run to finish\.\n$/);
});

test('the wait script fails at the bound with an error annotation that says what to do, and on a list it cannot read', async() => {
  // The bound is a few hundred milliseconds of real time, so how many reads fit under it depends on the machine:
  // the fake clock above pins the reads, and this pins what the script says and how it exits at the bound.
  const bound = await waitScript([{ status: 200, body: { workflow_runs: [run(4900, 'in_progress'), run(4800, 'queued')] } }]);

  assert.equal(bound.status, 1);
  assert.match(bound.stdout, /^::error title=Screen reader lanes::the scheduled audit waited 0 minutes and run 4900 and run 4800 of screenreader-nightly\.yml did not finish\. One screen reader run at a time, so the lanes did not start\. Re-run this job once the lanes are free: it starts the audit on the commit the schedule read \(tests\/AGENTS\.md, "A11y: the audit and the proof runs"\)\.$/m);
  assert.match(bound.stderr, /^screenreader-wait: the scheduled audit waited 0 minutes and run 4900 and run 4800/);
  assert.ok(bound.requests.length >= 1, 'it read the list before giving up');
  assert.doesNotMatch(bound.stdout, /the lanes can start/, 'it never says the lanes are free');

  const forbidden = await waitScript([{ status: 403, body: { message: 'Resource not accessible by integration' } }],
    { args: ['--workflow', 'screenreader-nightly.yml', '--bound-minutes', '1', '--interval-seconds', '0.05'] });

  assert.equal(forbidden.status, 1);
  assert.equal(forbidden.requests.length, LIST_ATTEMPTS, 'three reads, never the whole bound');
  assert.match(forbidden.stdout, /::error title=Screen reader lanes::the runs could not be listed 3 times in a row, so it is not known whether a screen reader run is in flight: GET http:\/\/127\.0\.0\.1:\d+\/repos\/o\/r\/actions\/workflows\/screenreader-nightly\.yml\/runs\?per_page=100 answered 403: /);

  const noRunId = await waitScript([{ status: 200, body: { workflow_runs: [] } }], { env: { GITHUB_RUN_ID: '' } });

  assert.equal(noRunId.status, 1);
  assert.match(noRunId.stdout, /^::error title=Screen reader lanes::GITHUB_RUN_ID is not set, so the runs of screenreader-nightly\.yml could not be read\.\n$/);
  assert.deepEqual(noRunId.requests, []);

  const noBound = await waitScript([{ status: 200, body: { workflow_runs: [] } }], { args: ['--workflow', 'screenreader-nightly.yml', '--interval-seconds', '60'] });

  assert.equal(noBound.status, 2);
  assert.match(noBound.stderr, /^screenreader-wait: name --workflow, and a --bound-minutes and an --interval-seconds above zero\.\n$/);
});
