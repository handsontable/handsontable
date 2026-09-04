import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// Emitted Types is on CI Gate's `needs` list. GitHub reports a job timeout as
// `cancelled`, and the gate treats that as a failure, so a 15-minute budget
// that attw regularly exceeded blocked otherwise-green PRs (#13373, #13375).
// The workflow comments record the constraints this file pins: the timeout
// floor, a single cached install instead of three `npx -y` downloads, attw
// limited to the typed public roots on PRs, and no reusable-workflow contexts
// in job-level env. A revert of any of those puts the race — or a 0-job
// parse failure — back.

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const WORKFLOW = read(path.join('.github', 'workflows', 'emitted-types.yml'));
const CHECKS = read(path.join('.github', 'workflows', 'checks.yml'));
const TEST_YML = read(path.join('.github', 'workflows', 'test.yml'));
const DEVELOP_YML = read(path.join('.github', 'workflows', 'develop.yml'));
const withoutComments = (source) => source.replace(/#[^\n]*/g, '');
const workflow = withoutComments(WORKFLOW);

/**
 * Return the first `@version` pin for `name` in the comment-stripped workflow.
 *
 * @param {string} name Package name as it appears before `@` (escaped for RegExp).
 * @returns {string} The pinned version.
 */
function pin(name) {
  const match = workflow.match(new RegExp(`${name}@([\\d.]+)`));

  assert.ok(match, `missing ${name}@<version> pin in emitted-types.yml`);

  return match[1];
}

/**
 * Escape a semver string for use inside a RegExp.
 *
 * @param {string} value A version like `5.1.6`.
 * @returns {string} The escaped pattern.
 */
function escapeDots(value) {
  return value.replace(/\./g, '\\.');
}

test('the Emitted Types job budget is at least 30 minutes', () => {
  const timeout = Number(/\n    timeout-minutes:\s*(\d+)/.exec(workflow)?.[1]);

  assert.ok(
    Number.isFinite(timeout) && timeout >= 30,
    `job-level timeout-minutes (${timeout}) must be >= 30 — 15 minutes cancelled on a cold npx + full-export attw`
  );
});

test('type-check tools are installed once, not via three cold npx -y calls', () => {
  const ts = pin('typescript');
  const publint = pin('publint');
  const attw = pin('@arethetypeswrong\\/cli');

  assert.match(
    workflow,
    /name: Install type-check tools/,
    'expected a single Install type-check tools step'
  );
  assert.match(
    workflow,
    /path:\s*~\/\.npm/,
    'expected the npm cache path so the install is not a cold download every run'
  );
  assert.match(
    workflow,
    new RegExp(
      `key:\\s*emitted-types-npx-\\$\\{\\{\\s*runner\\.os\\s*\\}\\}-ts${escapeDots(ts)}-publint${escapeDots(publint)}-attw${escapeDots(attw)}`
    ),
    'cache key must name each installed version — a stale key is a permanent miss'
  );
  assert.match(
    workflow,
    /restore-keys:\s*emitted-types-npx-\$\{\{\s*runner\.os\s*\}\}-/,
    'expected a prefix restore-key so a one-tool bump still hits the other tarballs'
  );
  assert.match(
    workflow,
    /npm install --no-package-lock --prefer-offline --no-audit --no-fund/,
    'pinned install must not revalidate metadata or audit on a warm ~/.npm'
  );
  assert.match(
    workflow,
    /tsc" --version \| grep -F 'Version 5\.1\.6'/,
    'install step must assert the root tsc is the pinned 5.1.x, not attw\'s nested compiler'
  );
  assert.match(
    workflow,
    /TOOLS_BIN=/,
    'call tsc/publint/attw via TOOLS_BIN — do not prepend the whole .bin to GITHUB_PATH'
  );
  assert.doesNotMatch(
    workflow,
    /GITHUB_PATH/,
    'do not put the tool .bin on GITHUB_PATH — it also fronts semver/marked/highlight'
  );
  assert.match(workflow, /"\$TOOLS_BIN\/tsc"/);
  assert.match(workflow, /"\$TOOLS_BIN\/publint"/);
  assert.match(workflow, /"\$TOOLS_BIN\/attw"/);
  assert.equal(
    (workflow.match(/npx\s+-y/g) || []).length,
    0,
    'do not bring back per-step `npx -y` — each one is an uncached registry fetch'
  );
});

test('job-level env does not use contexts GitHub rejects on a reusable workflow', () => {
  // Reusable workflows reject ${{ runner.* }} (and env/steps/job) in
  // jobs.<id>.env. The caller then fails at parse time with 0 jobs, so CI
  // Gate never reports (DEV-2783, runs 33853301602 / 33853913419). The
  // block must sit above `steps:` so this regex can see it — moving it
  // below is valid YAML and the same parse failure, so fail closed.
  const jobEnv = workflow.match(/\n    env:\n([\s\S]*?)\n    steps:/)?.[1];

  assert.ok(
    jobEnv != null && jobEnv.trim() !== '',
    'job-level env must sit above steps: — a reusable workflow rejects runner/env/steps/job there'
  );
  assert.doesNotMatch(
    jobEnv,
    /\$\{\{\s*(?:runner|env|steps|job)\./,
    'do not use ${{ runner.* }}, ${{ env.* }}, ${{ steps.* }} or ${{ job.* }} in job-level env of a reusable workflow'
  );
});

test('attw checks the typed public roots on PRs and every path on run-all', () => {
  assert.match(
    workflow,
    /--entrypoints\s+\.\s+base\s+registry\s+settings\s+themes/,
    'PR attw must pass --entrypoints . base registry settings themes'
  );
  assert.match(
    workflow,
    /ATTW_FULL/,
    'trunk attw must be gated on the attw-full input'
  );
  assert.match(
    workflow,
    /untyped-resolution/,
    'full attw must ignore untyped dist/language paths'
  );
  assert.match(
    workflow,
    /no-resolution/,
    'full attw must ignore CSS/theme assets'
  );
  assert.match(
    withoutComments(TEST_YML),
    /attw-full:\s*\$\{\{\s*needs\.checks\.outputs\.run-all == 'true'\s*\}\}/,
    'test.yml must pass attw-full from run-all (master / release / publish.yml)'
  );
  assert.match(
    withoutComments(DEVELOP_YML),
    /attw-full:\s*\$\{\{\s*needs\.checks\.outputs\.run-all == 'true'\s*\}\}/,
    'develop.yml must pass attw-full from run-all'
  );
  assert.doesNotMatch(
    workflow,
    /npx\s+-y\s+@arethetypeswrong\/cli/,
    'do not invoke attw through npx -y'
  );
});

test('changing the Emitted Types workflow itself turns the job on', () => {
  assert.match(
    CHECKS,
    /verify-types:\n\s+-\s+'\.\/handsontable\/\*\*'\n\s+-\s+'\.\/\.github\/workflows\/emitted-types\.yml'/,
    'verify-types must include emitted-types.yml — otherwise a workflow-only PR skips the job it is changing'
  );
});
