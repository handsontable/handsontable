/**
 * Writes a seed or nightly build's comparison result to the job summary, and reds the nightly.
 *
 * `visual-gate.mjs` runs on pull requests only. Until this step a push to a base branch compared
 * its render, reconciled the goldens and said nothing about what changed, and the nightly full
 * render — which never writes the goldens — had nothing to turn a difference into a red run.
 *
 * All branching lives in `../lib/seed-report.mjs`, which is pure and unit-tested; this wrapper
 * reads `.reg/out.json` and the environment, appends the Markdown to `$GITHUB_STEP_SUMMARY`,
 * writes `verdict` and `report-url` to `$GITHUB_OUTPUT`, and sets the exit code. The seed tier
 * never fails on a difference, so `visual.yml` can run this before the reconcile step; the nightly
 * fails on any difference, and that failure is the run's verdict.
 *
 * Usage: node visual-tests/scripts/seed-report.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { summarizeBuild } from '../lib/seed-report.mjs';

// The same variable `visual-gate.mjs` honors, so the docs suite (DEV-2860) can point both
// wrappers at its own artifacts directory; unset, reg-suit's `.reg/` as before.
const WORKING_DIR = process.env.VISUAL_GATE_DIR
  ? resolve(process.env.VISUAL_GATE_DIR)
  : join(import.meta.dirname, '..', '.reg');
const domain = process.env.VISUAL_REPORT_DOMAIN;
const actualKey = process.env.REG_ACTUAL_KEY;

let report = null;

try {
  report = JSON.parse(await readFile(join(WORKING_DIR, 'out.json'), 'utf-8'));
} catch (error) {
  // The comparison step died before writing it; the summary says so and the step fails.
  console.log(`No comparison result read: ${error.message}`);
}

const runUrl = process.env.VISUAL_RUN_URL ?? '';
const reportUrl = domain && actualKey ? `https://${domain}/${actualKey}/index.html` : '';

const result = summarizeBuild({
  report,
  tier: process.env.VISUAL_TIER || 'seed',
  branch: process.env.GITHUB_REF_NAME ?? '',
  sha: process.env.GITHUB_SHA ?? '',
  // Passed through `env:` by the workflow, never interpolated into a script body: a commit
  // message can contain shell.
  headCommitMessage: process.env.HEAD_COMMIT_MESSAGE ?? '',
  reportUrl,
  runUrl,
});

if (process.env.GITHUB_STEP_SUMMARY) {
  await writeFile(process.env.GITHUB_STEP_SUMMARY, `${result.markdown}\n`, { flag: 'a' });
} else {
  console.log(result.markdown);
}

// A seed whose merge changed variants the pull request never rendered gets a
// comment on that pull request: the body goes to a file the sticky-comment step
// posts, and `comment=true` plus the number tell the step to run.
if (result.comment) {
  await writeFile(join(WORKING_DIR, 'seed-comment.md'), `${result.comment}\n`, 'utf-8');
}

// The workflow keeps the diff-report artifact on a `changed` nightly, links the
// report from the run, and posts the seed comment when there is one. The run
// URL stands in when nothing was published.
if (process.env.GITHUB_OUTPUT) {
  await writeFile(process.env.GITHUB_OUTPUT, [
    `verdict=${result.verdict}`,
    `report-url=${reportUrl || runUrl}`,
    `comment=${result.comment ? 'true' : 'false'}`,
    `pull=${result.pull ?? ''}`,
    '',
  ].join('\n'), { flag: 'a' });
}

console.log(result.summary);

if (result.blocking) {
  console.error(`::error::${result.summary}`);
  process.exitCode = 1;
} else if (result.verdict === 'changed') {
  console.log(`::warning::${result.summary}`);
}
