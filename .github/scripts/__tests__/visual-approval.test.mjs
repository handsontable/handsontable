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
  // Comments stripped first. A job block runs to the next job id, so the cutover
  // note that tells an admin to DELETE the `visual-approved` label sits inside
  // this block, and naming a thing in prose is not a code path. What must stay
  // gone is any actual read of it.
  const code = compare.split('\n').filter(line => !/^\s*#/.test(line)).join('\n');

  assert.doesNotMatch(code, /visual-approved|issues\/\$PR_NUMBER\/labels/, 'the gate must not read the retired label');
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

test('a failed comparison skips the approval instead of asking a reviewer to bless a red run', () => {
  // Any `if:` replaces the implicit `success()` on `needs`, so `!cancelled()`
  // alone would run this job when `compare` FAILED. The verdict step writes its
  // output on `always()`, so a failure in a later step of `compare` can leave
  // `verdict == 'changed'` on a red job — and the reviewer would be approving a
  // build that cannot go green whatever they click. `compare` guards itself the
  // same way against `render`.
  const approve = job(visual, 'approve');

  assert.match(approve, /if: \$\{\{ !failure\(\) && !cancelled\(\)/,
    'the approve job must not run when compare failed');
});

test('nothing lets the verdict go missing while compare stays green', () => {
  // The gate's safety rests on an invariant that is otherwise unstated: an empty
  // `verdict` only ever accompanies a red `compare`. If that broke — a
  // `continue-on-error` on the verdict step, or a swallowed error in the wrapper
  // — `approve` would be skipped on a green run and `CI Gate` would go green with
  // differences nobody reviewed. Two things hold it up, so both are pinned.
  const compare = job(visual, 'compare');
  const wrapper = read('visual-tests/scripts/visual-gate.mjs');

  // Scoped to the verdict step rather than the whole job. The seed's out-of-tier
  // comment step carries `continue-on-error` on purpose — a failed comment must
  // never keep a seed from landing. What makes that safe is EVENT separation, not
  // step order: that step is `github.event_name == 'push'` and the verdict step is
  // `github.event_name == 'pull_request'`, so the two never run in the same job.
  // (It also sits earlier in the file than the verdict step, not later.)
  const fromVerdict = compare.slice(compare.indexOf('- name: Visual verdict'));
  const verdictStep = fromVerdict.slice(0, fromVerdict.indexOf('- name:', 10));

  assert.ok(verdictStep.includes('id: gate'), 'the verdict step was not found where expected');
  assert.doesNotMatch(verdictStep, /continue-on-error/,
    'a continue-on-error on the verdict step decouples "verdict unset" from "compare red", which is '
      + 'what makes a skipped approve safe');

  // The wrapper writes the output BEFORE it decides the exit code, so even a
  // blocked verdict exports one. Only a throw can leave it unset, and a throw
  // fails the step.
  const writesOutput = wrapper.indexOf('GITHUB_OUTPUT');
  const setsExitCode = wrapper.indexOf('verdict.blocked');

  assert.ok(writesOutput > -1 && setsExitCode > -1, 'the wrapper no longer has both halves');
  assert.ok(writesOutput < setsExitCode,
    'the verdict output must be written before the exit-code branch, or a blocked run exports no verdict');
});

test('the approve job requests the permission its API call needs', () => {
  // `GET /actions/runs/{run_id}/approvals` needs `actions: read`. Requested
  // explicitly so a repository default too narrow for it fails at run startup,
  // rather than 403ing on the first pull request that happens to have
  // differences — the step's own error text anticipates that, but a loud early
  // failure beats a late one. `pull-requests: write` is for the comment below.
  const approve = job(visual, 'approve');

  assert.match(approve, /permissions:\n\s+actions: read\n\s+pull-requests: write/,
    'the approve job must request actions: read for the approvals API');
});

test('an approval takes down the request it answered', () => {
  // `compare` posts a comment asking for approval and nothing else would ever
  // retract it, so it reads as "still pending" through merge. The label flow got
  // this free from the re-run it triggered; the environment gate has no re-run.
  // Same sticky header, or it adds a second comment instead of replacing the one
  // that asked.
  const compare = job(visual, 'compare');
  const approve = job(visual, 'approve');

  assert.match(approve, /- name: Record the approval on the pull request/,
    'nothing rewrites the approval request once it has been answered');
  assert.match(approve, /header: visual-tests/);
  assert.match(compare, /header: visual-tests/,
    'the two comments must share a sticky header, or the approval posts a second comment');
  assert.match(approve, /core\.setOutput\('approved-by'/,
    'the comment names the approver, so the assert step has to export it');
});

test('a bootstrap run uploads no diff report, because it compared nothing', () => {
  // `!= 'clean'` also matched `bootstrap` — a run that seeded the baseline and
  // compared nothing — and uploaded the whole `.reg` tree with nothing in it to
  // review. `error` still uploads through `failure()`.
  const compare = job(visual, 'compare');
  const [, uploadBlock = ''] = compare.split('- name: Upload the visual diff report');

  assert.match(uploadBlock.slice(0, 400), /steps\.gate\.outputs\.verdict == 'changed'/,
    'the diff report should be kept for a changed verdict, not for every non-clean one');
});
