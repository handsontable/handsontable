import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The codemod's own suite (`codemod/test/workflow-gates.test.mjs`) pins the same wiring, but that suite runs only
// when the codemod scope changed, and a pull request that edits nothing but a workflow does not change it. This
// file runs in the root `test:tooling`, which every pull request runs, so a workflow edit that unwires the codemod
// suite from the develop push, or drops the `run-codemod` input, fails here.
//
// Text-based, matching `lint-ratchet-workflow.test.mjs`: no YAML parser is a dependency of the repo root.

const root = repoRoot();
const read = file => readFileSync(path.join(root, '.github/workflows', file), 'utf8');

/**
 * The text of one job: from its two-space-indented key to the next line indented no deeper.
 *
 * @param {string} workflow The workflow file's contents.
 * @param {string} id The job id.
 * @returns {string} The job, or an empty string when there is none.
 */
function jobOf(workflow, id) {
  const lines = workflow.split('\n');
  const first = lines.findIndex(line => line === `  ${id}:`);

  if (first === -1) {
    return '';
  }

  const rest = lines.slice(first + 1);
  const length = rest.findIndex(line => line.trim() !== '' && line.match(/^ */)[0].length <= 2);

  return [lines[first], ...(length === -1 ? rest : rest.slice(0, length))].join('\n');
}

test('develop.yml runs the codemod suite on a develop push, scoped by the test-codemod flag or a dispatch', () => {
  // Without this job the suite ran on pull requests only (test.yml calls lint.yml, no push pipeline does), so two
  // pull requests that were green alone merged red with no signal.
  const job = jobOf(read('develop.yml'), 'codemod');

  assert.notEqual(job, '', 'develop.yml has no `codemod` job');
  assert.match(job, /needs: \[ checks \]/);
  assert.match(job, /needs\.checks\.outputs\.test-codemod == 'true'/);
  assert.match(job, /github\.event_name == 'workflow_dispatch'/);
  assert.doesNotMatch(job, /run-all/, 'run-all is true on every develop push, so it would not scope the job');
  assert.match(job, /npm run test --prefix codemod/);
  assert.match(job, /os: windows-/);
});

test('the develop codemod job is advisory: it cannot fail the Develop run or hold the experimental publish', () => {
  // The chained `experimental` publish waits for a green Develop run. A broken migration tool must not hold the grid.
  // On a pull request the suite stays a real gate through lint.yml, which this job does not touch.
  const develop = read('develop.yml');
  const job = jobOf(develop, 'codemod');

  assert.match(job, /^ {4}continue-on-error: true$/m);
  assert.match(job, /if: \$\{\{ failure\(\) \}\}[\s\S]*::warning/, 'the failure must stay visible as an annotation');
  assert.doesNotMatch(develop.replace(job, ''), /needs:.*\bcodemod\b/, 'no other job may wait for the codemod job');
  assert.doesNotMatch(read('lint.yml'), /continue-on-error:[^\n]*\n[^\n]*codemod/, 'lint.yml keeps the gate');
});

test('test.yml forwards the codemod scope to lint.yml as run-codemod, and checks.yml exports the flag', () => {
  const lint = jobOf(read('test.yml'), 'lint');
  const checks = read('checks.yml');

  assert.match(lint, /uses: \.\/\.github\/workflows\/lint\.yml/);
  assert.match(
    lint,
    /run-codemod: \$\{\{ needs\.checks\.outputs\.run-all == 'true' \|\| needs\.checks\.outputs\.test-codemod == 'true' \}\}/,
  );
  assert.match(checks, /test-codemod: \{ value: '\$\{\{ jobs\.scope\.outputs\.test-codemod \}\}' \}/);
  assert.match(checks, /test-codemod: \$\{\{ steps\.path-filter\.outputs\.test-codemod \}\}/);
});

/**
 * The text of one step of a job: from its `- name:` line to the next step (or the end of the job).
 *
 * @param {string} job The text of a job.
 * @param {string} name The name of the step.
 * @returns {string} The step, or an empty string when there is none.
 */
function stepOf(job, name) {
  const lines = job.split('\n');
  const first = lines.findIndex(line => line.trim() === `- name: ${name}`);

  if (first === -1) {
    return '';
  }

  const indent = lines[first].match(/^ */)[0].length;
  const rest = lines.slice(first + 1);
  const length = rest.findIndex(line => line.trim() !== '' && !line.trim().startsWith('#')
    && line.match(/^ */)[0].length <= indent);

  return [lines[first], ...(length === -1 ? rest : rest.slice(0, length))].join('\n');
}

/**
 * The paths of the `test-codemod` filter of checks.yml.
 *
 * @param {string} checks The contents of checks.yml.
 * @returns {string[]} The entries, without quotes.
 */
function codemodFilter(checks) {
  const lines = checks.split('\n');
  const first = lines.findIndex(line => line === '            test-codemod:');

  assert.notEqual(first, -1, 'checks.yml has no test-codemod filter');

  const entries = [];

  for (const line of lines.slice(first + 1)) {
    const match = /^ {14}- '(.+)'$/.exec(line);

    if (!match) {
      break;
    }

    entries.push(match[1]);
  }

  return entries;
}

/**
 * The matrix legs of a job as `<os family>|<node major>`.
 *
 * @param {string} job The text of a job.
 * @returns {string[]} One entry per `- os:` and `node:` pair, sorted.
 */
function legsOf(job) {
  return [...job.matchAll(/- os: (\S+)\s+node: (\d+)/g)]
    .map(([, os, node]) => `${os.startsWith('windows') ? 'windows' : 'ubuntu'}|${node}`).sort();
}

test('the test-codemod filter names the codemod, the lockfile, the migration guides, and the core sources its tests read', () => {
  const entries = codemodFilter(read('checks.yml'));

  assert.deepEqual([...entries].sort(), [
    './LICENSE.txt',
    './codemod/**',
    './docs/content/guides/upgrade-and-migration/**',
    './handsontable/src/core/hooks/constants.ts',
    './handsontable/src/dataMap/metaManager/metaSchema.ts',
    './handsontable/src/plugins/exportFile/exportFile.ts',
    './handsontable/src/renderers/numericRenderer/utils.ts',
    './pnpm-lock.yaml',
  ]);
});

test('lint.yml takes the run-codemod input as a boolean that is off unless the caller sets it', () => {
  const lint = read('lint.yml');
  const input = lint.slice(lint.indexOf('      run-codemod:\n'), lint.indexOf('\njobs:'));

  assert.notEqual(lint.indexOf('      run-codemod:\n'), -1, 'lint.yml declares no run-codemod input');
  assert.match(input, /type: boolean/);
  assert.match(input, /default: false/);
});

test('the Codemod tests step of the core job runs the codemod package, and only on run-codemod', () => {
  // Without the gate every pull request pays about a minute on the critical path of `build`. Without the right
  // prefix the step runs another package's suite and the codemod's never runs in CI.
  const core = jobOf(read('lint.yml'), 'core');
  const step = stepOf(core, 'Codemod tests');

  assert.notEqual(step, '', 'the core job has no `Codemod tests` step');
  assert.match(step, /^ {8}if: inputs\.run-codemod$/m, 'the step must be gated');
  assert.match(step, /^ {8}run: npm run test --prefix codemod$/m);
  assert.equal(core.match(/--prefix codemod/g).length, 1, 'no other step of the core job runs the codemod suite');
});

test('the codemod job of lint.yml runs on a pull request, on the same gate, on Linux Node 20 and 24 and Windows Node 22', () => {
  const job = jobOf(read('lint.yml'), 'codemod');

  assert.notEqual(job, '', 'lint.yml has no `codemod` job');
  assert.match(job, /^ {4}if: inputs\.run-codemod$/m, 'the job must be gated');
  assert.match(job, /^ {4}runs-on: \$\{\{ matrix\.os \}\}$/m);
  assert.match(job, /^ {6}fail-fast: false$/m, 'one red leg must not hide the others');
  assert.deepEqual(legsOf(job), ['ubuntu|20', 'ubuntu|24', 'windows|22']);
  assert.match(job, /node-version: \$\{\{ matrix\.node \}\}/);
  assert.match(stepOf(job, 'Install the codemod\'s dependencies'),
    /run: pnpm install --filter @handsontable\/codemod --ignore-scripts --frozen-lockfile/);
  assert.match(stepOf(job, 'Codemod tests'), /^ {8}run: npm run test --prefix codemod$/m);
});

test('the codemod job of lint.yml keeps the install of the workspace out: only the codemod dependencies, no lifecycle script', () => {
  const job = jobOf(read('lint.yml'), 'codemod');

  assert.doesNotMatch(job, /setup-workspace/);
  assert.doesNotMatch(job, /pnpm install(?![^\n]*--ignore-scripts)/);
});
