import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The performance jobs download the shared UMD build artifact on the single
// self-hosted runner. In run 37947963835 (2026-10-09) `actions/download-artifact`
// logged "Download artifact has finished successfully" and then never exited:
// the job sat in that step until its 90-minute timeout, holding the only
// performance runner. A healthy download takes 4 to 15 seconds and a healthy
// job about 8 minutes.
//
// The guard is a step `timeout-minutes` on the download, one retry, and a job
// timeout sized to a real run. A composite action step cannot take
// `timeout-minutes` (the runner's action schema has no such key for one), so the
// download must stay a job step: in performance.yml, before the performance-run
// composite, and in performance-tests.yml, which inlines its steps.
//
// Text-based, like visual-tiers.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

const SITES = [
  { file: '.github/workflows/performance.yml', jobId: 'run' },
  { file: '.github/workflows/performance-tests.yml', jobId: 'performance-tests' },
];
const COMPOSITE = '.github/actions/performance-run/action.yml';
const DOWNLOAD = /^(?:- | {8})uses: actions\/download-artifact@/m;
// The ceiling on one download attempt. A healthy one takes seconds; anything
// near this is a hang, not a slow network.
const MAX_STEP_MINUTES = 10;
// The ceiling on the whole job: the slowest successful run of the last 50
// before this guard took 19.3 minutes (a slow pnpm cache restore).
const MAX_JOB_MINUTES = 30;

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

/**
 * A job's steps, split on the six-space `- ` that starts each one. Only the
 * first line loses its indent, so a step's keys sit at eight spaces, or after
 * the `- ` on its first line.
 *
 * @param {string} jobBody One job's text, from `job()`.
 * @returns {string[]} One entry per step.
 */
function steps(jobBody) {
  const [, stepsBlock = ''] = jobBody.split(/^ {4}steps:$/m);

  return stepsBlock.split(/^ {6}(?=- )/m).filter(block => block.trim());
}

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

for (const { file, jobId } of SITES) {
  describe(`${file} guards the UMD artifact download`, () => {
    const body = job(read(file), jobId);
    const all = steps(body);
    const downloads = all.filter(step => DOWNLOAD.test(step));

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
      for (const step of downloads) {
        const minutes = Number(stepKey(step, 'timeout-minutes'));

        assert.ok(Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_STEP_MINUTES,
          `each download attempt needs timeout-minutes between 1 and ${MAX_STEP_MINUTES}: `
            + 'without it a download that never exits holds the runner until the job timeout');
      }
    });

    test('the first attempt survives its own failure, and only then the retry runs', () => {
      const [first, retry] = downloads;
      const id = stepKey(first, 'id');

      assert.ok(id, 'the first attempt needs an id for the retry to read its outcome');
      assert.equal(stepKey(first, 'continue-on-error'), 'true',
        'a timed-out first attempt must not fail the job before the retry runs');
      assert.equal(stepKey(retry, 'if'), `inputs.hot-prebuilt && steps.${id}.outcome == 'failure'`);
      assert.equal(stepKey(retry, 'continue-on-error'), null,
        'the retry is the last attempt: its failure must fail the job');
    });

    test('the dist is extracted after both attempts', () => {
      const extract = all.findIndex(step => /tar -zxf dist\.tar\.gz/.test(step));

      assert.ok(extract > all.indexOf(downloads[1]), 'the extract step must follow the retry');
    });

    test('the job timeout fits a real run and still covers both attempts', () => {
      const minutes = jobTimeout(body);
      const attempts = downloads.reduce((sum, step) => sum + Number(stepKey(step, 'timeout-minutes')), 0);

      assert.ok(minutes !== null && minutes <= MAX_JOB_MINUTES,
        `the job timeout must be at most ${MAX_JOB_MINUTES} minutes, so a hang anywhere fails fast`);
      assert.ok(minutes > attempts, 'the job timeout must outlast both download attempts');
    });
  });
}

test('performance.yml downloads before it runs the composite', () => {
  const all = steps(job(read('.github/workflows/performance.yml'), 'run'));
  const composite = all.findIndex(step => /uses: \.\/\.github\/actions\/performance-run$/m.test(step));
  const lastDownload = all.findLastIndex(step => DOWNLOAD.test(step));

  assert.ok(composite > lastDownload && lastDownload !== -1);
});

test('the performance-run composite does not download the artifact itself', () => {
  // A composite step has no `timeout-minutes`, so a download here is unguarded.
  const code = read(COMPOSITE).replace(/^\s*#.*$/gm, '');

  assert.doesNotMatch(code, /uses: actions\/download-artifact@/);
  assert.doesNotMatch(code, /tar -zxf dist\.tar\.gz/,
    'extraction belongs next to the download, in the calling job');
});
