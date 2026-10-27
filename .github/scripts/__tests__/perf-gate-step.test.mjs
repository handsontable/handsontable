// Pins how the performance regression gate is wired into the pull request path
// (.github/actions/performance-run/action.yml, called by performance.yml).
//
// The gate's verdict is decided in the teardown and enforced by the composite's last step. Three
// things break it silently: a step added after it (a red job would then hide whatever that step
// publishes, or the step would not run), an `if:` that skips it after a failed step or runs it on a
// cancelled job, and a body file the live read and the gate do not agree on (the accept marker would
// then come from the frozen payload, which a re-run cannot update). The develop golden run must
// never be gated: develop.yml says the performance job never gates the publish.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

const COMPOSITE = '.github/actions/performance-run/action.yml';
const GOLDEN = '.github/workflows/performance-tests.yml';
const GATE_STEP = 'Enforce the performance gate';
const BODY_STEP = 'Read the live pull-request body';
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
 * @param {string} body One step's text.
 * @param {string} key A step key, such as `if` or `run`.
 * @returns {string | null} The key's value on its own line, at the step's six-space key indent.
 */
function stepKey(body, key) {
  return (body.match(new RegExp(`^ {6}${key}: (.+)$`, 'm')) ?? [])[1] ?? null;
}

/**
 * @param {string} body One step's text.
 * @param {string} name An environment variable.
 * @returns {string | null} Its value in the step's `env:` block.
 */
function stepEnv(body, name) {
  return (body.match(new RegExp(`^ {8}${name}: (.+)$`, 'm')) ?? [])[1] ?? null;
}

describe('the performance gate on the pull request path', () => {
  const steps = compositeSteps(read(COMPOSITE));
  const names = steps.map(step => step.name);
  const gate = steps.find(step => step.name === GATE_STEP);
  const body = steps.find(step => step.name === BODY_STEP);
  const run = steps.find(step => step.name === 'Run performance tests');

  test('the enforce step exists and runs the gate script', () => {
    assert.ok(gate, `${COMPOSITE} has no "${GATE_STEP}" step`);
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
      BODY_STEP,
    ]) {
      assert.ok(names.includes(earlier), `${COMPOSITE} no longer has "${earlier}"`);
      assert.ok(names.indexOf(earlier) < names.indexOf(GATE_STEP), `"${earlier}" must run before the gate`);
    }
  });

  test('the enforce step runs after a failed step but not on a cancelled job, on pull requests only', () => {
    assert.equal(stepKey(gate.body, 'if'), "${{ !cancelled() && github.event_name == 'pull_request' }}");
  });

  test('the live body read cannot fail the job, and writes the file the gate reads', () => {
    assert.ok(body, `${COMPOSITE} has no "${BODY_STEP}" step`);
    assert.equal(stepKey(body.body, 'continue-on-error'), 'true');
    assert.equal(stepKey(body.body, 'if'), stepKey(gate.body, 'if'));
    assert.equal(stepEnv(body.body, 'BODY_FILE'), stepEnv(gate.body, 'PERF_PR_BODY_FILE'));
    assert.ok(body.body.includes('github.rest.pulls.get('), 'the body must be read live, not from the payload');
  });

  test('the gate falls back to the payload body through the environment, never inline', () => {
    assert.equal(stepEnv(gate.body, 'PERF_PR_BODY'), '${{ github.event.pull_request.body }}');
  });

  test('the run passes the base branch and base commit the verdict needs', () => {
    assert.ok(run, `${COMPOSITE} has no "Run performance tests" step`);
    assert.equal(stepEnv(run.body, 'PERF_BASE_REF'), "${{ github.base_ref || '' }}");
    assert.equal(stepEnv(run.body, 'PERF_BASE_SHA'), "${{ github.event.pull_request.base.sha || '' }}");
  });
});

describe('the develop golden run is never gated', () => {
  test(`${GOLDEN} does not run the gate script`, () => {
    const code = read(GOLDEN).split('\n').filter(line => !line.trimStart().startsWith('#')).join('\n');

    assert.ok(!code.includes('enforce-gate.mjs'));
  });
});
