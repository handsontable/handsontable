import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The CI half of the determinism ratchet. `lint-ratchet-cli.test.mjs` proves
// the CLI reads only the branch's own lines when it is handed the base
// branch's LIVE tip; this pins that `lint.yml` actually hands it that, and
// keeps the job shape the fold-in settled on. The ratchet is the first
// `GATE_BASE` gate that BLOCKS, so a base it should never take — the event
// payload's frozen `base.sha` — is a red PR on someone else's commits, not a
// noisy report.
//
// Text-based, matching `fork-guards.test.mjs`: no YAML parser is a dependency
// of the repo root.

const root = repoRoot();
const source = readFileSync(path.join(root, '.github/workflows/lint.yml'), 'utf8');

/**
 * Split a workflow into its jobs, by the two-space indent that starts each one.
 *
 * @param {string} workflow The workflow file's contents.
 * @returns {Array<{name: string, body: string}>} One entry per job.
 */
function jobsOf(workflow) {
  const [, jobsBlock = ''] = workflow.split(/^jobs:$/m);

  return jobsBlock
    .split(/^ {2}(?=[A-Za-z0-9_-]+:$)/m)
    .filter(block => block.trim())
    .map(block => ({ name: block.split(':')[0].trim(), body: block }));
}

const core = jobsOf(source).find(job => job.name === 'core');

test('the ratchet is a step of the core lint job, not a job of its own', () => {
  // A second job paired a full-history checkout with a whole workspace install
  // to lint a handful of files, and sat on the critical path (`build` needs
  // `lint`). The step reuses the install `core` already has.
  assert.ok(core, 'lint.yml has no `core` job');
  assert.deepEqual(jobsOf(source).map(job => job.name), ['core', 'visual-tests']);
  assert.ok(core.body.includes('node .github/scripts/lint-ratchet.mjs'), 'the ratchet does not run in `core`');
});

test('the ratchet step keeps the scope gate the separate job had', () => {
  assert.match(
    core.body,
    /- name: Fail on new sleep\(\)[^\n]*\n\s+if: inputs\.run-ratchet && github\.event_name == 'pull_request'\n/,
    'the step must run on a pull_request with the `run-ratchet` scope input only',
  );
});

test('the ratchet diffs from the live tip of the PR base branch, never the payload base SHA', () => {
  // The checkout is `refs/pull/N/merge`; `base.sha` is an ancestor of it, so
  // `merge-base(base.sha, HEAD)` is `base.sha` itself and a stale payload (a
  // "Re-run all jobs" after the base moved, or a branch that merged the base)
  // attributes every later base commit to the PR.
  // The comments may explain `base.sha`; no expression may read it.
  assert.doesNotMatch(source, /\$\{\{[^}]*base\.sha/, 'an expression in lint.yml reads the payload base SHA');
  assert.match(core.body, /BASE_REF: \$\{\{ github\.event\.pull_request\.base\.ref \}\}/);
  assert.match(
    core.body,
    /git fetch [^\n]*origin "\+refs\/heads\/\$\{BASE_REF\}:refs\/remotes\/origin\/\$\{BASE_REF\}"/,
    'the step must refresh the base branch before diffing from it',
  );
  assert.match(core.body, /GATE_BASE="origin\/\$\{BASE_REF\}" node \.github\/scripts\/lint-ratchet\.mjs/);
});

test('a failed refresh of the base branch is a warning, not a red job', () => {
  // "Never a false block": the full-history checkout already holds a copy of
  // every branch, so the CLI can diff from that, and with none it skips.
  assert.match(
    core.body,
    /git fetch [^\n]*\\\n\s+\|\| echo "::warning::[^\n]*origin\/\$\{BASE_REF\}/,
    'the fetch has no `|| echo "::warning::…"` fallback',
  );
});

test('the core checkout has the history the merge-base needs exactly when the ratchet runs', () => {
  // A one-commit clone cannot reach the fork point; a full clone on every lint
  // run pays for a pack close to a gigabyte. The checkout depth carries the
  // step's own condition, so the two cannot drift apart.
  const stepCondition = core.body.match(/\n\s+if: (inputs\.run-ratchet && github\.event_name == 'pull_request')\n/);
  const depth = core.body.match(/fetch-depth: \$\{\{ \((.+?)\) && '0' \|\| '1' \}\}/);

  assert.ok(stepCondition, 'the ratchet step has no `if:`');
  assert.ok(depth, 'the checkout has no conditional fetch-depth');
  assert.equal(depth[1], stepCondition[1], 'the checkout depth and the step run on different conditions');
});
