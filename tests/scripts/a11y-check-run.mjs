/**
 * Posts the `A11y / axe report` check run for the commit the axe job scanned.
 *
 * Reads `test-results/a11y/comparison.json` (the a11y reporter writes it), builds
 * the payload through `lib/a11y-check-run.mjs`, and creates the check run through
 * the Checks API (`lib/github-check-run.mjs`, which adds annotations past the first 50 in further
 * requests). Run by
 * `.github/workflows/a11y.yml` after the scan, behind the fork guard (a fork's
 * token cannot write checks) and with `continue-on-error`: the check run reports,
 * it never decides the job.
 *
 * Environment: `GITHUB_TOKEN` (with `checks: write`), `GITHUB_REPOSITORY`,
 * `A11Y_HEAD_SHA` (the pull request's head, not the merge commit, or the check
 * does not show on the pull request), and optionally `A11Y_REPORT_URL`,
 * `GITHUB_API_URL`, `GITHUB_SERVER_URL` and `GITHUB_RUN_ID`.
 *
 * `--dry-run` prints the payload instead of posting it, and needs none of them. A posted check
 * run's URL goes to the step output `check-url`, which the pull request comment links.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baselineLines, buildCheckRun, pageLines } from '../lib/a11y-check-run.mjs';
import { postCheckRun } from '../lib/github-check-run.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPARISON = path.join(TESTS_ROOT, 'test-results/a11y/comparison.json');
const env = process.env;
const dryRun = process.argv.includes('--dry-run');
const runUrl = env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
  ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
  : undefined;
const payload = buildCheckRun({
  comparison: existsSync(COMPARISON) ? JSON.parse(readFileSync(COMPARISON, 'utf8')) : null,
  pages: pageLines(readFileSync(path.join(TESTS_ROOT, 'a11y/pages.mjs'), 'utf8')),
  baseline: baselineLines(readFileSync(path.join(TESTS_ROOT, 'a11y/axe-baseline.json'), 'utf8')),
  reportUrl: env.A11Y_REPORT_URL || undefined,
  runUrl,
});

if (dryRun) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(0);
}

for (const name of ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'A11Y_HEAD_SHA']) {
  if (!env[name]) {
    process.stderr.write(`a11y-check-run: ${name} is not set, so no check run was posted.\n`);
    process.exit(1);
  }
}

const created = await postCheckRun({
  token: env.GITHUB_TOKEN,
  repository: env.GITHUB_REPOSITORY,
  headSha: env.A11Y_HEAD_SHA,
  payload,
  detailsUrl: env.A11Y_REPORT_URL || runUrl,
  apiUrl: env.GITHUB_API_URL,
});

process.stdout.write(`a11y-check-run: posted "${payload.name}" (${payload.conclusion}): ${payload.title}\n${created.html_url}\n`);
// The pull request comment links the check run.
if (env.GITHUB_OUTPUT) {
  appendFileSync(env.GITHUB_OUTPUT, `check-url=${created.html_url}\n`);
}
