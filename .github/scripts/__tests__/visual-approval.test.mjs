import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The visual approval is an environment-protected job, the manual-qa.yml
// mechanism: Compare reports `changed`, `approve` waits on the `visual-approval`
// environment, and CI Gate holds through its `needs` edge. Three ways it fails
// open without anything going red, each pinned here:
//
//   1. the gate step stops exporting `verdict`, or the approve job stops keying
//      on it — differences then pass with nothing reviewed;
//   2. the approve job stops asserting a recorded approval — a missing or
//      unprotected environment is auto-created and runs straight through;
//   3. the retired label machinery comes back — content-blind, rubber-stamped,
//      and unusable on fork runs.
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const visual = read('.github/workflows/visual.yml');

/**
 * One job's block, by the two-space indent that starts each job.
 *
 * @param {string} source The workflow file's contents.
 * @param {string} id The job id.
 * @returns {string} The job's text.
 */
function job(source, id) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);
  const blocks = jobsBlock.split(/^ {2}(?=[A-Za-z0-9_-]+:$)/m);

  return blocks.find(block => block.startsWith(`${id}:`)) ?? '';
}

test('Compare exports the verdict the approval keys on', () => {
  const compare = job(visual, 'compare');

  assert.match(compare, /outputs:\n\s+verdict: \$\{\{ steps\.gate\.outputs\.verdict \}\}/);
  assert.match(compare, /report-url: \$\{\{ steps\.gate\.outputs\.report-url \}\}/);
  assert.match(compare, /- name: Visual verdict\n\s+id: gate\n/, 'the gate step must carry the id the outputs read');
  assert.match(compare, /node \.\/visual-tests\/scripts\/visual-gate\.mjs/);
  assert.doesNotMatch(compare, /visual-approved|issues\/\$PR_NUMBER\/labels/, 'the gate must not read the retired label');
});

test('the approval job waits on the environment only for a changed pull-request verdict', () => {
  const approve = job(visual, 'approve');

  assert.ok(approve, 'visual.yml lost its approve job');
  assert.match(approve, /needs: \[ compare \]/);
  assert.match(approve, /github\.event_name == 'pull_request'/);
  assert.match(approve, /needs\.compare\.outputs\.verdict == 'changed'/);
  assert.match(approve, /environment:\n\s+name: visual-approval\n\s+url: \$\{\{ needs\.compare\.outputs\.report-url \}\}/);
});

test('the approval job asserts a recorded approval instead of trusting the environment', () => {
  const approve = job(visual, 'approve');

  assert.match(approve, /actions\/runs\/\{run_id\}\/approvals/, 'the approve job no longer reads the run approvals — it would fail OPEN on environment drift');
  assert.match(approve, /environment\.name === 'visual-approval'/);
  assert.match(approve, /core\.setFailed/, 'the approve job no longer fails closed when no approval is recorded');
});

test('the gate library emits the verdict the workflow reads, and the wrapper writes it to the job outputs', () => {
  const lib = read('visual-tests/lib/visual-gate.mjs');
  const wrapper = read('visual-tests/scripts/visual-gate.mjs');

  for (const verdict of ['bootstrap', 'error', 'clean', 'changed']) {
    assert.match(lib, new RegExp(`verdict: '${verdict}'`), `evaluate() no longer produces the '${verdict}' verdict`);
  }

  assert.match(wrapper, /GITHUB_OUTPUT/);
  assert.match(wrapper, /verdict=\$\{verdict\.verdict\}/);
  assert.match(wrapper, /report-url=/);
});

test('the label machinery stays retired', () => {
  for (const gone of [
    '.github/workflows/visual-approval-rerun.yml',
    '.github/workflows/visual-cleanup.yml',
    '.github/scripts/visual-approval-rerun.mjs',
    '.github/scripts/lib/visual-approval-rerun.mjs',
  ]) {
    assert.ok(!existsSync(path.join(root, gone)), `${gone} is back; the visual approval is the environment, not a label`);
  }

  assert.doesNotMatch(read('visual-tests/lib/visual-gate.mjs'), /visual-approved/);
});

test('manual-qa and the visual approval assert their approvals the same way', () => {
  // One mechanism, two environments. If manual-qa.yml's assertion shape changes,
  // this job must change with it.
  const manualQa = read('.github/workflows/manual-qa.yml');
  const approve = job(visual, 'approve');

  assert.match(manualQa, /actions\/runs\/\{run_id\}\/approvals/);
  assert.match(approve, /actions\/runs\/\{run_id\}\/approvals/);
  assert.match(manualQa, /state === 'approved'/);
  assert.match(approve, /state === 'approved'/);
});
