import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, steps } from '../lib/workflow-text.mjs';
import { CONFIRM_MAX_SCENARIOS } from '../../../performance-tests/lib/gate.mjs';

// The performance jobs download the shared UMD build artifact on the single
// self-hosted runner. In run 37947963835 (2026-10-09) `actions/download-artifact`
// logged "Download artifact has finished successfully" and then never exited:
// the job sat in that step until its 90-minute timeout, holding the only
// performance runner. A healthy download takes 4 to 15 seconds and a healthy
// job about 8 minutes.
//
// The guard is a step `timeout-minutes` on the download, a check that keeps a
// complete archive a failed first attempt left, one retry when none is left,
// and a job timeout that still lets a run whose scenarios time out report. A
// composite action step cannot take `timeout-minutes` (the runner's action
// schema has no such key for one), so the download must stay a job step: in
// performance.yml, before the performance-run composite, and in
// performance-tests.yml, which inlines its steps.
//
// Text-based, like visual-tiers.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

// `confirms`: the job runs the regression gate's confirm re-run (pull request runs only, through the
// composite), which can add up to CONFIRM_MAX_SCENARIOS more scenarios at the Playwright timeout.
const SITES = [
  {
    file: '.github/workflows/performance.yml',
    jobId: 'run',
    consumer: /uses: \.\/\.github\/actions\/performance-run$/m,
    confirms: true,
  },
  {
    file: '.github/workflows/performance-tests.yml',
    jobId: 'performance-tests',
    consumer: /name: Run performance tests$/m,
    confirms: false,
  },
];
const COMPOSITE = '.github/actions/performance-run/action.yml';
const DOWNLOAD = /^(?:- | {8})uses: actions\/download-artifact@/m;
const EXTRACT = /tar -zxf dist\.tar\.gz/;
// The bounds on one download attempt. A healthy one takes seconds, but in run
// 37947963835 the first `ListArtifacts` call stalled for 6 minutes before the
// toolkit's own retry fetched the file, so an attempt must outlast that stall;
// anything past the ceiling is a hang, not a slow network.
const MIN_STEP_MINUTES = 7;
const MAX_STEP_MINUTES = 10;
// What a job spends outside the scenarios and the downloads, with room: the
// slowest of the 204 successful runs since 2026-09-24, before this guard, took
// 19.3 minutes in all (a 10.7-minute pnpm cache restore).
const SETUP_MINUTES = 20;
// How far above the slowest run the suite allows the job timeout may sit. The
// job timeout is a backstop for a hang outside the downloads, so it should not
// drift far past what a real run can take.
const JOB_TIMEOUT_SLACK_MINUTES = 15;

/**
 * A step's single-line key, or null when the step does not declare it.
 *
 * @param {string} step One step's text, from `steps()`.
 * @param {string} key The key name.
 * @returns {string|null} The value, trimmed.
 */
function stepKey(step, key) {
  const match = step.match(new RegExp(`^(?:- | {8})${key}: (.*)$`, 'm'));

  return match ? match[1].trim() : null;
}

/**
 * A job's own `timeout-minutes`, or null when it has none.
 *
 * @param {string} jobBody One job's text, from `job()`.
 * @returns {number|null} The timeout in minutes.
 */
function jobTimeout(jobBody) {
  const match = jobBody.match(/^ {4}timeout-minutes: (\d+)$/m);

  return match ? Number(match[1]) : null;
}

/**
 * The longest the performance suite itself lets its scenarios run: every test, one after another
 * (`workers` must stay 1, or the scenarios measure each other), each up to the Playwright test timeout.
 *
 * @returns {{ tests: number, minutes: number, perTest: number }} The test count, their total timeout in
 * minutes, and one test's timeout.
 */
function scenarioBudget() {
  const config = read('performance-tests/playwright.config.ts');
  const timeout = config.match(/^\s*timeout: (\d+) \* 60 \* 1000,$/m);
  const workers = config.match(/^\s*workers: (\d+),$/m);

  assert.ok(timeout, 'performance-tests/playwright.config.ts must keep `timeout: <minutes> * 60 * 1000`');
  assert.equal(workers?.[1], '1', 'the scenarios must run one at a time, or they measure each other');

  const scenariosDir = path.join(root, 'performance-tests/scenarios');
  const specs = readdirSync(scenariosDir, { recursive: true }).filter(file => String(file).endsWith('.spec.ts'));
  const tests = specs.reduce((sum, file) => sum
    + (read(path.join('performance-tests/scenarios', String(file))).match(/^\s*test(?:\.\w+)?\(/gm) ?? []).length, 0);

  assert.ok(tests > 0, 'no scenario tests found under performance-tests/scenarios');

  return { tests, minutes: tests * Number(timeout[1]), perTest: Number(timeout[1]) };
}

for (const { file, jobId, consumer, confirms } of SITES) {
  describe(`${file} guards the UMD artifact download`, () => {
    const body = job(read(file), jobId);
    const all = steps(body);
    const downloads = all.filter(step => DOWNLOAD.test(step));
    const [first, retry] = downloads;
    const firstId = first ? stepKey(first, 'id') : null;
    const check = all.find(step => firstId && stepKey(step, 'if') === `inputs.hot-prebuilt && steps.${firstId}.outcome == 'failure'`
      && !DOWNLOAD.test(step));

    test('the job exists and has steps', () => {
      assert.ok(all.length > 0, `job "${jobId}" not found in ${file}, or it has no steps`);
    });

    test('there are exactly two download attempts of the UMD artifact', () => {
      assert.equal(downloads.length, 2, 'expected a first attempt and one retry');
      for (const step of downloads) {
        assert.match(step, /^ {10}name: handsontable-build-umd$/m);
        assert.match(stepKey(step, 'if') ?? '', /^inputs\.hot-prebuilt\b/,
          'a download must stay gated on the hot-prebuilt input');
      }
    });

    test('every download attempt carries a step timeout', () => {
      assert.equal(downloads.length, 2, 'expected a first attempt and one retry');
      for (const step of downloads) {
        const minutes = Number(stepKey(step, 'timeout-minutes'));

        assert.ok(Number.isInteger(minutes) && minutes >= MIN_STEP_MINUTES && minutes <= MAX_STEP_MINUTES,
          `each download attempt needs timeout-minutes between ${MIN_STEP_MINUTES} and ${MAX_STEP_MINUTES}: `
            + 'without one a download that never exits holds the runner until the job timeout, and below '
            + `${MIN_STEP_MINUTES} an attempt dies in the 6-minute stall the toolkit's own retry recovers from`);
      }
    });

    test('the first attempt survives its own failure', () => {
      assert.equal(downloads.length, 2, 'expected a first attempt and one retry');
      assert.ok(firstId, 'the first attempt needs an id for the steps after it to read its outcome');
      assert.equal(stepKey(first, 'continue-on-error'), 'true',
        'a timed-out first attempt must not fail the job before the retry runs');
    });

    test('a complete archive the first attempt left is kept, and anything else removed', () => {
      // In run 37947963835 the file was complete and its digest checked before the step stopped exiting,
      // so a timeout must not throw a good archive away; a partial one must not reach the extract.
      assert.ok(check, 'expected a step gated on the first attempt failing, between the two attempts');
      assert.ok(stepKey(check, 'id'), 'the check needs an id for the retry to read its output');
      assert.match(check, /tar -tzf dist\.tar\.gz/, 'the check must prove the archive lists cleanly');
      assert.match(check, /rm -f dist\.tar\.gz/, 'the check must remove an archive that does not list');
      assert.match(check, /usable=true/);
      assert.ok(all.indexOf(first) < all.indexOf(check) && all.indexOf(check) < all.indexOf(retry),
        'the check must sit between the first attempt and the retry');
    });

    test('the retry runs only when the first attempt failed and left no usable archive', () => {
      assert.equal(downloads.length, 2, 'expected a first attempt and one retry');
      assert.ok(check, 'expected the archive check before the retry');
      assert.equal(stepKey(retry, 'if'), `inputs.hot-prebuilt && steps.${firstId}.outcome == 'failure' `
        + `&& steps.${stepKey(check, 'id')}.outputs.usable != 'true'`);
      assert.equal(stepKey(retry, 'continue-on-error'), null,
        'the retry is the last attempt: its failure must fail the job');
    });

    test('the dist is extracted, on the prebuilt path only, after both attempts and before the tests run', () => {
      assert.equal(downloads.length, 2, 'expected a first attempt and one retry');

      const extract = all.findIndex(step => EXTRACT.test(step));
      const tests = all.findIndex(step => consumer.test(step));

      assert.notEqual(extract, -1, 'expected the extract step');
      assert.equal(stepKey(all[extract], 'if'), 'inputs.hot-prebuilt',
        'an ungated extract fails every run that builds its own dist');
      assert.ok(extract > all.indexOf(retry), 'the extract step must follow the retry');
      assert.ok(tests !== -1 && extract < tests, 'the extract step must come before the tests run');
    });

    test('the job timeout outlasts the slowest run the suite allows, and not by much', () => {
      const minutes = jobTimeout(body);
      const attempts = downloads.reduce((sum, step) => sum + Number(stepKey(step, 'timeout-minutes')), 0);
      const scenarios = scenarioBudget();
      const confirm = confirms ? CONFIRM_MAX_SCENARIOS * scenarios.perTest : 0;
      const required = SETUP_MINUTES + attempts + scenarios.minutes + confirm;

      assert.ok(minutes !== null && minutes >= required,
        `the job timeout must be at least ${required} minutes (setup ${SETUP_MINUTES}, both download `
          + `attempts ${attempts}, ${scenarios.tests} scenarios at their Playwright timeout `
          + `${scenarios.minutes}, the confirm re-run ${confirm}): shorter, a run whose scenarios time `
          + 'out is cancelled before it reports');
      assert.ok(minutes <= required + JOB_TIMEOUT_SLACK_MINUTES,
        `the job timeout must stay within ${JOB_TIMEOUT_SLACK_MINUTES} minutes of ${required}, `
          + 'so a hang outside the downloads still fails reasonably fast');
    });
  });
}

test('performance.yml runs the composite after the downloads, even when they failed', () => {
  // Skipped after a failed download, the composite would leave the job summary empty and the sticky
  // comment on the previous push's numbers; run, it stops at its prebuilt check and reports why.
  const all = steps(job(read('.github/workflows/performance.yml'), 'run'));
  const composite = all.findIndex(step => /uses: \.\/\.github\/actions\/performance-run$/m.test(step));
  const lastDownload = all.findLastIndex(step => DOWNLOAD.test(step));

  assert.ok(composite > lastDownload && lastDownload !== -1);
  assert.equal(stepKey(all[composite], 'if'), '${{ !cancelled() }}');
});

test('the performance-run composite checks the prebuilt build first and does not download it', () => {
  const action = read(COMPOSITE);
  const [, stepsBlock = ''] = action.split(/^ {2}steps:$/m);
  const actionSteps = stepsBlock.split(/^ {4}(?=- )/m).filter(block => block.trim() && !/^\s*#/.test(block));
  const [checkStep] = actionSteps;

  assert.match(checkStep ?? '', /^- name: Check the prebuilt build$/m,
    'the prebuilt check must be the first step, so a missing build fails before the installs');
  assert.match(checkStep, /^ {6}if: inputs\.hot-prebuilt == 'true'$/m);
  assert.match(checkStep, /handsontable\/dist/);
  assert.match(checkStep, /performance-tests\/output\/result\.md/,
    'the reason must reach result.md, which the summary and the comment publish');
  assert.match(checkStep, /exit 1/);

  // A composite step has no `timeout-minutes`, so a download here is unguarded.
  const code = action.replace(/^\s*#.*$/gm, '');

  assert.doesNotMatch(code, /uses: actions\/download-artifact@/);
  assert.doesNotMatch(code, EXTRACT, 'extraction belongs next to the download, in the calling job');
});
