/**
 * Posts or edits the axe scan's sticky comment on the pull request.
 *
 * Reads `test-results/a11y/comparison.json` (the a11y reporter writes it), reads
 * `a11y/axe-baseline.json` at the base commit (the checked-out merge commit's first parent,
 * `baseCommit()`) through the contents API and compares it with the pull request's
 * (`baselineGrowth()`), builds the body through `lib/a11y-pr-comment.mjs`, and edits
 * the comment it posted on an earlier run or posts a new one (`upsertComment()`): every pull
 * request the scan ran on gets the comment, a clean one included. Run by
 * `.github/workflows/a11y.yml` on a pull request, behind the fork guard (a fork's token cannot
 * comment) and with `continue-on-error`. It talks to the REST API with `fetch`: the job's
 * Playwright container has no `gh`.
 *
 * Environment: `GITHUB_TOKEN` (with `pull-requests: write`), `GITHUB_REPOSITORY`,
 * `A11Y_PR_NUMBER`, `A11Y_CHECKOUT_SHA` (the commit the job checked out) and `A11Y_BASE_SHA` (the
 * event's base commit, the fallback when the checkout is not a merge commit; without either the
 * comment says the growth is unknown), and optionally `A11Y_REPORT_URL`, `A11Y_CHECK_URL`,
 * `GITHUB_API_URL`, `GITHUB_SERVER_URL` and `GITHUB_RUN_ID`. `--dry-run` prints the body instead
 * and needs none of them; with `--base <file>` (the baseline at the merge base,
 * `git show "$(git merge-base origin/develop HEAD)":tests/a11y/axe-baseline.json`) it reports the
 * growth too.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseCommit, baselineGrowth, readBaseBaseline, renderComment, upsertComment } from '../lib/a11y-pr-comment.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPARISON = path.join(TESTS_ROOT, 'test-results/a11y/comparison.json');
const BASELINE = path.join(TESTS_ROOT, 'a11y/axe-baseline.json');
const env = process.env;
const dryRun = process.argv.includes('--dry-run');
const baseIndex = process.argv.indexOf('--base');
const baseFile = baseIndex > -1 ? process.argv[baseIndex + 1] : undefined;
const comparison = existsSync(COMPARISON) ? JSON.parse(readFileSync(COMPARISON, 'utf8')) : null;

if (!comparison) {
  process.stderr.write('a11y-pr-comment: the scan wrote no comparison.json, so there is nothing to say; the check run reports it.\n');
  process.exit(0);
}
if (!dryRun) {
  for (const name of ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'A11Y_PR_NUMBER']) {
    if (!env[name]) {
      process.stderr.write(`a11y-pr-comment: ${name} is not set, so no comment was posted.\n`);
      process.exit(1);
    }
  }
}

const api = `${env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}`;

/**
 * Sends one REST request and returns its body, rejecting with an error that carries `status` on an
 * error status.
 *
 * @param {string} url The URL.
 * @param {object} [options] The request.
 * @param {string} [options.method] The method.
 * @param {object} [options.payload] The JSON body.
 * @param {boolean} [options.raw] Whether to ask for a file's raw content and return it as text.
 * @returns {Promise<any>} The parsed JSON, or the text when `raw`.
 */
async function request(url, { method = 'GET', payload, raw = false } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    throw Object.assign(new Error(`${method} ${url} answered ${response.status}: ${await response.text()}`), { status: response.status });
  }

  return raw ? response.text() : response.json();
}

/**
 * The pull request's own baseline, or `null` when it cannot be read (the reporter has reported
 * that as a tooling problem already).
 *
 * @returns {object|null} The baseline.
 */
function readHeadBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8'));
  } catch {
    return null;
  }
}

let base;

if (baseFile) {
  base = existsSync(baseFile) ? { text: readFileSync(baseFile, 'utf8') } : { error: `${baseFile} does not exist` };
} else if (!dryRun) {
  const commit = await baseCommit({ request, repoApi: api, checkedOut: env.A11Y_CHECKOUT_SHA, payloadBase: env.A11Y_BASE_SHA });

  base = commit.error ? commit : await readBaseBaseline({ request, repoApi: api, sha: commit.sha });
}

const growth = base ? baselineGrowth(base, readHeadBaseline()) : undefined;

if (growth?.error) {
  process.stderr.write(`a11y-pr-comment: baseline growth unknown: ${growth.error}\n`);
}

const body = renderComment(comparison, {
  reportUrl: env.A11Y_REPORT_URL || undefined,
  runUrl: env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
    ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
    : undefined,
  checkUrl: env.A11Y_CHECK_URL || undefined,
  growth,
});

if (dryRun) {
  process.stdout.write(`${body}\n`);
  process.exit(0);
}

const result = await upsertComment({ request, repoApi: api, prNumber: env.A11Y_PR_NUMBER, body });

process.stdout.write(`a11y-pr-comment: ${result.action} ${result.url}\n`);
