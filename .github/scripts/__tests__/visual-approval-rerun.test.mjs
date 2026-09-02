import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import {
  APPROVAL_LABEL, COMPARE_JOB, NO_RUN_GRACE_MS, decide,
} from '../lib/visual-approval-rerun.mjs';

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

const completedRun = { id: 1, status: 'completed', head_sha: 'abc', html_url: 'https://example.test/1' };
const failedCompare = [{ name: COMPARE_JOB, conclusion: 'failure' }];
const approve = (overrides = {}) => decide({
  run: completedRun, jobs: failedCompare, labels: [APPROVAL_LABEL], prHeadSha: 'abc', ...overrides,
});

test('a failed gate under the label is re-run', () => {
  const { action, reason } = approve();

  assert.equal(action, 'rerun');
  assert.match(reason, /re-running the failed jobs of run 1/i);
});

test('the gate job is matched when the workflow is nested one level deeper', () => {
  // publish.yml calls test.yml, which calls visual.yml, so the rendered job name
  // gains a `Tests / ` prefix. Not reachable from a pull request today, but the
  // suffix match costs nothing and a same-name exact match would silently stop.
  assert.equal(approve({ jobs: [{ name: `Tests / ${COMPARE_JOB}`, conclusion: 'failure' }] }).action, 'rerun');
});

test('a run that has not finished is waited for, not re-run', () => {
  // The endpoint rejects an in-progress run, and this is the COMMON state at
  // label time: the comment that prompts the approval is posted by Compare,
  // which is not the last job in the pipeline.
  const { action, reason } = approve({ run: { ...completedRun, status: 'in_progress' } });

  assert.equal(action, 'wait');
  assert.match(reason, /has not finished/);
});

test('a run that does not exist yet is waited for', () => {
  assert.equal(approve({ run: null }).action, 'wait');
});

test('a run that never appears is given up on well before the deadline', () => {
  const { action, reason } = approve({ run: null, elapsedMs: NO_RUN_GRACE_MS });

  assert.equal(action, 'skip');
  assert.match(reason, /nothing to re-run/);
});

test('a stripped label ends the wait instead of polling to the deadline', () => {
  // Ordering lock. `visual-cleanup.yml` strips the label on every push, so this
  // is how a push during the wait cancels the re-run. Read after the "still
  // running" branch, a pushed-to pull request would poll for the full timeout.
  const { action, reason } = decide({
    run: { ...completedRun, status: 'in_progress' },
    jobs: failedCompare,
    labels: [],
    prHeadSha: 'abc',
  });

  assert.equal(action, 'skip');
  assert.match(reason, /no longer on the pull request/);
});

test('a superseded run is not re-run', () => {
  // Re-running an old attempt puts it back into test.yml's per-ref concurrency
  // group, where it can cancel the run for the commit under review.
  const { action, reason } = approve({ prHeadSha: 'def' });

  assert.equal(action, 'skip');
  assert.match(reason, /superseded/);
});

test('a build whose gate never ran is left alone', () => {
  assert.equal(approve({ jobs: [{ name: 'Lint / eslint', conclusion: 'failure' }] }).action, 'skip');
});

test('a gate that passed is left alone', () => {
  assert.equal(approve({ jobs: [{ name: COMPARE_JOB, conclusion: 'success' }] }).action, 'skip');
});

for (const conclusion of ['cancelled', 'timed_out']) {
  test(`a ${conclusion} gate is not re-run, because rerun-failed-jobs would ignore it`, () => {
    const { action, reason } = approve({ jobs: [{ name: COMPARE_JOB, conclusion }] });

    assert.equal(action, 'skip');
    assert.match(reason, new RegExp(conclusion));
  });
}

// The script targets a job by its RENDERED name, which is composed from the
// caller's job name and the called workflow's job name. Renaming either would
// leave the automation silently skipping every approval, with a green run and
// nothing in the log to suggest the label had stopped working.
test('COMPARE_JOB matches the name the workflows actually render', () => {
  const caller = /\n {2}visual:\n {4}name: (.+)\n/.exec(read('.github/workflows/test.yml'));
  const called = /\n {2}compare:\n {4}name: (.+)\n/.exec(read('.github/workflows/visual.yml'));

  assert.ok(caller, 'test.yml has no `visual:` job with a name');
  assert.ok(called, 'visual.yml has no `compare:` job with a name');
  assert.equal(COMPARE_JOB, `${caller[1].trim()} / ${called[1].trim()}`);
});

test('the workflow triggers on the label, and grants exactly the write it needs', () => {
  const workflow = read('.github/workflows/visual-approval-rerun.yml');

  assert.match(workflow, /pull_request:\n {4}types: \[ labeled \]/);
  assert.match(workflow, new RegExp(`github\\.event\\.label\\.name == '${APPROVAL_LABEL}'`));
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /node \.\/\.github\/scripts\/visual-approval-rerun\.mjs/);
});

test('the concurrency group is keyed by label as well as by pull request', () => {
  // `labeled` fires for EVERY label, and the group is resolved when the run is
  // created — before the job's `if:` skips it. Keyed on the number alone, adding
  // any unrelated label mid-wait cancels the waiter, and the skipped run that
  // replaced it reports nothing.
  const group = /concurrency:\n {2}group: (.+)\n/.exec(read('.github/workflows/visual-approval-rerun.yml'));

  assert.ok(group, 'the workflow declares no concurrency group');
  assert.match(group[1], /github\.event\.label\.name/);
});

test('the job outlives the wait it is asking the script to perform', () => {
  // A job timeout at or below the script's own deadline would kill it mid-wait,
  // so the contributor gets a bare cancellation instead of the message telling
  // them to re-run the job by hand.
  const workflow = read('.github/workflows/visual-approval-rerun.yml');
  const jobTimeout = Number(/timeout-minutes: (\d+)/.exec(workflow)[1]);
  const scriptWait = Number(/WAIT_TIMEOUT_MINUTES: (\d+)/.exec(workflow)[1]);

  assert.ok(
    jobTimeout > scriptWait,
    `timeout-minutes (${jobTimeout}) must exceed WAIT_TIMEOUT_MINUTES (${scriptWait})`
  );
});
