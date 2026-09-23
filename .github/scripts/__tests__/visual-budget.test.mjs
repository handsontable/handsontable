import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The budget only binds anything because `visual.yml` runs it, in one place, in one order. Three ways
// it stops binding without going red, each pinned here:
//
//   1. the step disappears, or stops failing the job — the budget becomes a comment;
//   2. it runs BEFORE the verdict, so there is no `comment.md` to prepend to and the section is lost;
//   3. it runs AFTER the mirror, so the job summary — the only place a fork run can read it — carries
//      the verdict without the budget.
//
// Text-based, like visual-approval.test.mjs and fork-guards.test.mjs: no YAML parser is a dependency
// of the repo root.

const root = repoRoot();
const WORKFLOW = path.join(root, '.github/workflows/visual.yml');
const read = rel => readFileSync(path.join(root, rel), 'utf8');

/**
 * Where a named step starts in the workflow text.
 *
 * @param {string} workflow The workflow source.
 * @param {string} name The step's `name:`.
 * @returns {number} The index, or -1.
 */
function stepAt(workflow, name) {
  return workflow.indexOf(`- name: ${name}`);
}

test('the compare job runs the budget, and a violation fails it', () => {
  const workflow = readFileSync(WORKFLOW, 'utf8');
  const step = stepAt(workflow, 'Visual budget');

  assert.notEqual(step, -1, 'visual.yml no longer has a `Visual budget` step; the budget binds nothing');
  assert.match(workflow.slice(step, step + 600), /node \.\/visual-tests\/scripts\/visual-budget\.mjs/,
    'the step must invoke the budget script');

  // No `continue-on-error`: a budget that reports and does not block is a comment, and the whole point
  // is that growing the set takes a deliberate act rather than a shrug.
  assert.doesNotMatch(workflow.slice(step, step + 600), /continue-on-error/,
    'the budget step must be able to fail the job');
});

test('the budget runs between the verdict and the mirror', () => {
  // Order is the contract. The verdict writes `comment.md`; the budget prepends its section to it; the
  // mirror copies the result into the job summary, which on a fork run is the only place either is
  // readable. Any other order silently drops one of the two.
  const workflow = readFileSync(WORKFLOW, 'utf8');
  const verdict = stepAt(workflow, 'Visual verdict');
  const budget = stepAt(workflow, 'Visual budget');
  const mirror = stepAt(workflow, 'Mirror the verdict to the job summary');

  assert.ok(verdict !== -1 && budget !== -1 && mirror !== -1, 'one of the three steps is gone');
  assert.ok(verdict < budget,
    'the budget must run AFTER the verdict — it prepends to the comment the verdict writes, so running '
    + 'first leaves it with nothing to prepend to and the section disappears');
  assert.ok(budget < mirror,
    'the budget must run BEFORE the mirror, or the job summary carries the verdict without it — and on '
    + 'a fork run the summary is the only place either is readable');
});

test('the budget step survives a failed comparison, and reads the body as data', () => {
  const workflow = readFileSync(WORKFLOW, 'utf8');
  const step = workflow.slice(stepAt(workflow, 'Visual budget'), stepAt(workflow, 'Mirror the verdict'));

  // `always()`, for the reason the verdict has it: a comparison that failed still rendered something,
  // and a build that grew the set by 200 records while failing for an unrelated reason is exactly the
  // build nobody looks at.
  assert.match(step, /if:\s*always\(\)/,
    'without always(), an implicit success() is ANDed on and a red comparison skips the budget');

  // The description reaches the script through the environment. Interpolated into the `run:` line it
  // would be shell, and a body containing backticks would execute.
  assert.match(step, /VISUAL_PR_BODY: \$\{\{ github\.event\.pull_request\.body \}\}/,
    'the pull-request body must be passed as an environment variable, never interpolated into `run:`');
  assert.doesNotMatch(step, /run:[\s\S]*pull_request\.body/,
    'a description interpolated into the run line is shell, not text');
});

test('the budget file and the script it is read by are both present', () => {
  // The step names a path; if either half moves, the job fails at runtime on a build that already
  // spent twenty minutes rendering.
  assert.doesNotThrow(() => JSON.parse(read('visual-tests/visual-budget.json')),
    'visual-tests/visual-budget.json is missing or is not JSON');
  assert.ok(read('visual-tests/scripts/visual-budget.mjs').includes('evaluateBudget'),
    'the budget script no longer calls evaluateBudget()');

  const packageJson = JSON.parse(read('visual-tests/package.json'));

  assert.equal(packageJson.scripts.budget, 'node ./scripts/visual-budget.mjs',
    'the `budget` script is how this is run by hand; keep it pointing at the script the workflow runs');
});
