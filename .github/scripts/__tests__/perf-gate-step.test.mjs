// Pins how the performance regression gate is wired into the pull request path:
// the composite's enforce step (.github/actions/performance-run/action.yml) and
// performance.yml's `approve` job, which waits on the `performance-approval`
// environment the way visual.yml's `approve` job waits on `visual-approval`.
//
// The ways it breaks silently: a step after the enforce step (a later failure
// would hide behind it, or a later publish would not run); an enforce step that
// can leave `verdict` unset on a GREEN job (`approve` would be skipped and a
// regression would merge unreviewed); an `approve` job that runs after a red
// `run` (a reviewer would bless a run that cannot go green) or trusts the
// environment instead of asserting an approval (a missing environment is
// auto-created unprotected); and the retired description token coming back as a
// second, unreviewed way through. The develop golden run is never gated:
// develop.yml says the performance job never gates the publish.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job } from '../lib/workflow-text.mjs';
import { OUTCOMES } from '../../../performance-tests/lib/gate-enforce.mjs';

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

const COMPOSITE = '.github/actions/performance-run/action.yml';
const CALLER = '.github/workflows/performance.yml';
const GOLDEN = '.github/workflows/performance-tests.yml';
const GATE_STEP = 'Enforce the performance gate';
const GATE_SCRIPT = 'performance-tests/scripts/enforce-gate.mjs';

/**
 * A composite action's steps, split on the four-space `- ` that starts each one. A comment block
 * above a step stays with the step before it, so keys are read at their own indent.
 *
 * @param {string} source The action.yml contents.
 * @returns {{ name: string, body: string }[]} The steps in order.
 */
function compositeSteps(source) {
  const [, stepsBlock = ''] = source.split(/^ {2}steps:$/m);

  return stepsBlock
    .split(/^ {4}(?=- )/m)
    .filter(block => block.startsWith('- '))
    .map(body => ({ name: (body.match(/^- name: (.+)$/m) ?? [])[1] ?? '', body }));
}

/**
 * @param {string} body One composite step's text.
 * @param {string} key A step key, such as `if` or `run`.
 * @returns {string | null} The key's value on its own line, at the step's six-space key indent.
 */
function stepKey(body, key) {
  return (body.match(new RegExp(`^ {6}${key}: (.+)$`, 'm')) ?? [])[1] ?? null;
}

/**
 * @param {string} body One composite step's text.
 * @param {string} name An environment variable.
 * @returns {string | null} Its value in the step's `env:` block.
 */
function stepEnv(body, name) {
  return (body.match(new RegExp(`^ {8}${name}: (.+)$`, 'm')) ?? [])[1] ?? null;
}

/**
 * @param {string} source A workflow or action file.
 * @returns {string} the file without its comment lines, so prose about a key never matches as one
 */
function code(source) {
  return source.split('\n').filter(line => !line.trimStart().startsWith('#')).join('\n');
}

describe('the enforce step exports the verdict the approval keys on', () => {
  const composite = read(COMPOSITE);
  const steps = compositeSteps(composite);
  const names = steps.map(step => step.name);
  const gate = steps.find(step => step.name === GATE_STEP);
  const run = steps.find(step => step.name === 'Run performance tests');

  test('the enforce step exists, carries the id the outputs read, and runs the gate script', () => {
    assert.ok(gate, `${COMPOSITE} has no "${GATE_STEP}" step`);
    assert.equal(stepKey(gate.body, 'id'), 'gate');
    assert.equal(stepKey(gate.body, 'run'), `node ${GATE_SCRIPT}`);
    assert.ok(existsSync(path.join(root, GATE_SCRIPT)), `${GATE_SCRIPT} does not exist`);
  });

  test('the enforce step is the last step, after everything the run publishes', () => {
    assert.equal(names.at(-1), GATE_STEP);

    for (const earlier of [
      'Upload performance-tests output',
      'Deploy PR report to GitHub Pages',
      'Write the performance summary to the job summary',
      'Post performance summary to pull request',
    ]) {
      assert.ok(names.includes(earlier), `${COMPOSITE} no longer has "${earlier}"`);
      assert.ok(names.indexOf(earlier) < names.indexOf(GATE_STEP), `"${earlier}" must run before the gate`);
    }
  });

  test('the enforce step runs after a failed step but not on a cancelled job, on pull requests only', () => {
    assert.equal(stepKey(gate.body, 'if'), "${{ !cancelled() && github.event_name == 'pull_request' }}");
  });

  test('the enforce step cannot fail quietly: no continue-on-error, so an unset verdict means a red job', () => {
    assert.doesNotMatch(gate.body, /^\s*continue-on-error:/m);
  });

  test('the script writes the verdict output before it sets the exit code', () => {
    const script = read(GATE_SCRIPT);
    const writesOutput = script.indexOf('GITHUB_OUTPUT');
    const setsExitCode = script.indexOf('process.exitCode');

    assert.ok(writesOutput > -1 && setsExitCode > -1, 'the script no longer has both halves');
    assert.ok(writesOutput < setsExitCode, 'a run that exits non-zero must still have exported its verdict');
  });

  test('the composite exports the verdict, its summary and the report URL', () => {
    assert.match(composite, /^ {2}verdict:\n(?: {4}.*\n)*? {4}value: \$\{\{ steps\.gate\.outputs\.verdict \}\}$/m);
    assert.match(composite, /^ {2}summary:\n(?: {4}.*\n)*? {4}value: \$\{\{ steps\.gate\.outputs\.summary \}\}$/m);
    assert.match(composite, /^ {2}report-url:\n(?: {4}.*\n)*? {4}value: \$\{\{ steps\.report-url\.outputs\.pages_url \}\}$/m);
    assert.match(read(GATE_SCRIPT), /verdict=\$\{result\.outcome\}\\nsummary=\$\{summary\}\\n/,
      'the script writes both outputs the composite reads');
  });

  test('the run passes the base branch and base commit the verdict needs', () => {
    assert.ok(run, `${COMPOSITE} has no "Run performance tests" step`);
    assert.equal(stepEnv(run.body, 'PERF_BASE_REF'), "${{ github.base_ref || '' }}");
    assert.equal(stepEnv(run.body, 'PERF_BASE_SHA'), "${{ github.event.pull_request.base.sha || '' }}");
  });

  test('only the composite marks a run as gated, on the condition the enforce step runs on', () => {
    assert.equal(stepEnv(run.body, 'PERF_GATED'), "${{ github.event_name == 'pull_request' && '1' || '' }}");
    assert.match(stepKey(gate.body, 'if'), /github\.event_name == 'pull_request'/);
    // performance-tests.yml compares on one pull_request path too, with no enforce step, no approve
    // job and no budget for the re-run.
    assert.doesNotMatch(code(read(GOLDEN)), /PERF_GATED/);
  });

  test('the retired description token is gone: an approval is the one way through', () => {
    for (const file of [COMPOSITE, CALLER, GATE_SCRIPT, 'performance-tests/lib/gate-enforce.mjs']) {
      assert.doesNotMatch(code(read(file)), /accept perf regression|PERF_PR_BODY/, file);
    }
  });
});

describe('the approve job waits on the performance-approval environment', () => {
  const caller = read(CALLER);
  const runJob = job(caller, 'run');
  const approve = job(caller, 'approve');

  test('the run job exports the composite\'s outputs', () => {
    assert.match(runJob, /^ {6}- uses: \.\/\.github\/actions\/performance-run\n {8}id: perf$/m);
    assert.match(runJob, /^ {4}outputs:\n {6}verdict: \$\{\{ steps\.perf\.outputs\.verdict \}\}\n {6}summary: \$\{\{ steps\.perf\.outputs\.summary \}\}\n {6}report-url: \$\{\{ steps\.perf\.outputs\.report-url \}\}$/m);
  });

  test('approve runs only on a regressed pull request verdict, and never after a red run', () => {
    assert.ok(approve, `${CALLER} has no approve job`);
    assert.match(approve, /^ {4}needs: \[ run \]$/m);
    assert.match(approve, /^ {4}if: \$\{\{ !failure\(\) && !cancelled\(\) && github\.event_name == 'pull_request'\n {6}&& needs\.run\.outputs\.verdict == '(\w+)' \}\}$/m);
    assert.equal(approve.match(/needs\.run\.outputs\.verdict == '(\w+)'/)[1], OUTCOMES.REGRESSED,
      'the approve job must key on the outcome the enforce step exports for a regression');
  });

  test('approve waits on the environment, on a hosted runner, with the permission its assertion needs', () => {
    assert.match(approve, /^ {4}environment:\n {6}name: performance-approval\n/m);
    assert.match(approve, /^ {4}runs-on: ubuntu-/m, 'waiting must not hold the only self-hosted runner');
    assert.match(approve, /^ {4}permissions:\n {6}actions: read\n {6}pull-requests: write$/m);
  });

  test('after an approval, approve rewrites the sticky comment that asked for it', () => {
    const fromRecord = approve.slice(approve.indexOf('- name: Record the approval on the pull request'));

    assert.ok(fromRecord.length > 0 && approve.includes('- name: Record the approval on the pull request'));
    // `success()`: after a failed assertion this would announce an approval with an empty login.
    assert.match(fromRecord, /^ {8}if: \$\{\{ success\(\) && github\.event_name == 'pull_request'$/m);
    // Write-token runs only: a fork or Dependabot token cannot comment.
    assert.match(fromRecord, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
    assert.match(fromRecord, /github\.actor != 'dependabot\[bot\]'/);
    // The same sticky header as run's comment, so it replaces the request instead of adding a second.
    assert.match(fromRecord, /^ {10}header: performance-tests$/m);
    assert.match(read(COMPOSITE), /^ {8}header: performance-tests$/m);
    assert.match(fromRecord, /@\$\{\{ steps\.assert\.outputs\.approved-by \}\}/);
    assert.match(approve, /^ {8}id: assert$/m);
    assert.match(approve, /core\.setOutput\('approved-by', approval\.user\.login\)/);
    assert.match(fromRecord, /\$\{\{ needs\.run\.outputs\.summary \}\}/);
  });

  test('approve asserts a recorded approval instead of trusting the environment', () => {
    assert.match(approve, /actions\/runs\/\{run_id\}\/approvals/,
      'the approve job no longer reads the run approvals: it would fail OPEN on environment drift');
    assert.match(approve, /environment\.name === 'performance-approval'/);
    assert.match(approve, /state === 'approved'/);
    assert.match(approve, /core\.setFailed/, 'the approve job no longer fails closed when no approval is recorded');
    assert.doesNotMatch(approve, /^\s*continue-on-error:/m);
  });

  test('manual-qa, the visual approval and this one assert their approvals the same way', () => {
    for (const other of [read('.github/workflows/manual-qa.yml'), job(read('.github/workflows/visual.yml'), 'approve')]) {
      assert.match(other, /actions\/runs\/\{run_id\}\/approvals/);
      assert.match(other, /state === 'approved'/);
    }
  });
});

describe('the develop golden run is never gated', () => {
  test(`${GOLDEN} neither enforces the gate nor waits for an approval`, () => {
    const golden = code(read(GOLDEN));

    assert.ok(!golden.includes('enforce-gate.mjs'));
    assert.ok(!golden.includes('performance-approval'));
  });
});
