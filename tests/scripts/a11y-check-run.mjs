/**
 * Posts the `A11y / axe report` check run for the commit the axe job scanned.
 *
 * Reads `test-results/a11y/comparison.json` (the a11y reporter writes it), builds
 * the payload through `lib/a11y-check-run.mjs`, and creates the check run through
 * the Checks API, adding annotations past the first 50 in further requests. Run by
 * `.github/workflows/a11y.yml` after the scan, behind the fork guard (a fork's
 * token cannot write checks) and with `continue-on-error`: the check run reports,
 * it never decides the job.
 *
 * Environment: `GITHUB_TOKEN` (with `checks: write`), `GITHUB_REPOSITORY`,
 * `A11Y_HEAD_SHA` (the pull request's head, not the merge commit, or the check
 * does not show on the pull request), and optionally `A11Y_REPORT_URL`,
 * `GITHUB_API_URL`, `GITHUB_SERVER_URL` and `GITHUB_RUN_ID`.
 *
 * `--dry-run` prints the payload instead of posting it, and needs none of them.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { annotationBatches, baselineLines, buildCheckRun, pageLines } from '../lib/a11y-check-run.mjs';

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

const api = `${env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}/check-runs`;
const [first, ...rest] = annotationBatches(payload.annotations);
const output = annotations => ({ title: payload.title, summary: payload.summary, annotations });

/**
 * Sends one Checks API request and returns its JSON body, throwing on an error status.
 *
 * @param {string} url The URL.
 * @param {string} method The method.
 * @param {object} body The body.
 * @returns {Promise<object>} The response body.
 */
async function send(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${method} ${url} answered ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

const created = await send(api, 'POST', {
  name: payload.name,
  head_sha: env.A11Y_HEAD_SHA,
  status: 'completed',
  conclusion: payload.conclusion,
  details_url: env.A11Y_REPORT_URL || runUrl,
  output: output(first),
});

for (const batch of rest) {
  await send(`${api}/${created.id}`, 'PATCH', { output: output(batch) });
}

process.stdout.write(`a11y-check-run: posted "${payload.name}" (${payload.conclusion}): ${payload.title}\n${created.html_url}\n`);
