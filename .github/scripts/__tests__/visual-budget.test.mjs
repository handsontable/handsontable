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

  // The description reaches the script through the environment and a file. Interpolated into the `run:`
  // line it would be shell, and a body containing backticks would execute.
  assert.doesNotMatch(step, /run:[\s\S]*pull_request\.body/,
    'a description interpolated into the run line is shell, not text');
});

test('the marker is read from the LIVE description, not the frozen event payload', () => {
  // `github.event.pull_request.body` is the body as it was when the run was triggered. `test.yml` has
  // no `edited` trigger, so adding the marker starts no run, and re-running replays the same payload —
  // a BLOCKING gate whose printed remedy ("say so in the description") could not be applied without
  // pushing a commit and paying a full re-render. checks.yml reads the live body for the same reason.
  const workflow = readFileSync(WORKFLOW, 'utf8');
  const readStep = stepAt(workflow, 'Read the live pull-request body');
  const budgetStep = stepAt(workflow, 'Visual budget');

  assert.notEqual(readStep, -1, 'the live-body step is gone; the marker can no longer be added by editing');
  assert.ok(readStep < budgetStep, 'the live body must be read before the budget reads it');
  assert.match(workflow.slice(readStep, budgetStep), /github\.rest\.pulls\.get/,
    'the live body comes from the API, not from the payload');
  assert.match(workflow.slice(readStep, budgetStep), /continue-on-error: true/,
    'a failed API read must fall back to the payload rather than failing the job');

  const step = workflow.slice(budgetStep, stepAt(workflow, 'Mirror the verdict'));

  assert.match(step, /VISUAL_PR_BODY_FILE:/, 'the budget step must be given the live body file');
  assert.match(step, /VISUAL_PR_BODY: \$\{\{ github\.event\.pull_request\.body \}\}/,
    'the payload stays as the fallback for when the API read failed');
});

test('the growth check is given the base branch\'s budget file', () => {
  // The marker keys on whether THIS pull request raised the file, which needs the base branch's copy.
  // Without it the check cannot run, and on a bootstrap the ceiling is this pull request's own file —
  // so the first pull request into a new base branch could add any number of records with nothing red.
  const workflow = readFileSync(WORKFLOW, 'utf8');
  const baseStep = stepAt(workflow, 'Read the base branch\'s visual budget');
  const budgetStep = stepAt(workflow, 'Visual budget');

  assert.notEqual(baseStep, -1, 'the base-budget step is gone; the growth check cannot run');
  assert.ok(baseStep < budgetStep, 'the base budget must be read before the budget judges it');
  assert.match(workflow.slice(baseStep, budgetStep), /git show FETCH_HEAD:visual-tests\/visual-budget\.json/,
    'the base copy comes from the base ref, not from the working tree');
  assert.match(workflow.slice(budgetStep, stepAt(workflow, 'Mirror the verdict')), /VISUAL_BUDGET_BASE_FILE:/,
    'the budget step must be given the base file');
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
