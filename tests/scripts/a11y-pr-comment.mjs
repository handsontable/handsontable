/**
 * Posts or edits the axe scan's sticky comment on the pull request.
 *
 * Reads `test-results/a11y/comparison.json` (the a11y reporter writes it), reads
 * `a11y/axe-baseline.json` at the base commit (the checked-out merge commit's first parent,
 * `baseCommit()`) through the contents API and judges what the pull request adds to it the way the
 * check run does (`baselineGuard()`, `lib/a11y-baseline-guard.mjs`), builds the body through
 * `lib/a11y-pr-comment.mjs`, and edits
 * the comment it posted on an earlier run or posts a new one (`upsertComment()`): every pull
 * request the scan ran on gets the comment, a clean one included. Run by
 * `.github/workflows/a11y.yml` on a pull request, behind the fork guard (a fork's token cannot
 * comment) and with `continue-on-error`. It talks to the REST API with `fetch`: the job's
 * Playwright container has no `gh`.
 *
 * Environment: `GITHUB_TOKEN` (with `pull-requests: write`), `GITHUB_REPOSITORY`,
 * `A11Y_PR_NUMBER`, `A11Y_CHECKOUT_SHA` (the commit the job checked out) and `A11Y_BASE_SHA` (the
 * event's base commit, the fallback when the checkout is not a merge commit; without either the
 * comment says the growth is unknown), `A11Y_HEAD_REF` (the pull request's branch, to find the head
 * the `a11y-exception-approved` label approved), and optionally `A11Y_EXCEPTION_APPROVERS`,
 * `A11Y_REPORT_URL`, `A11Y_CHECK_URL`, `GITHUB_API_URL`, `GITHUB_SERVER_URL` and `GITHUB_RUN_ID`.
 * `--dry-run` prints the body instead and needs none of them; with `--base <file>` (the baseline at
 * the merge base, `git show "$(git merge-base origin/develop HEAD)":tests/a11y/axe-baseline.json`),
 * `--base-pages <file>` (`tests/a11y/pages.mjs` there) and optionally `--approval <file>` it judges
 * the growth too (`guardFromFiles()`).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { approverList, baselineGuard, guardFromFiles } from '../lib/a11y-baseline-guard.mjs';
import { pageLines } from '../lib/a11y-check-run.mjs';
import { renderComment, upsertComment } from '../lib/a11y-pr-comment.mjs';
import { restClient } from '../lib/github-rest.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPARISON = path.join(TESTS_ROOT, 'test-results/a11y/comparison.json');
const BASELINE = path.join(TESTS_ROOT, 'a11y/axe-baseline.json');
const env = process.env;
const dryRun = process.argv.includes('--dry-run');
const argument = name => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);
const baseFile = argument('--base');
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

const request = restClient({ token: env.GITHUB_TOKEN });

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

const pageIds = source => pageLines(source).keys();
const approvers = approverList(env.A11Y_EXCEPTION_APPROVERS);
let guard;

if (baseFile) {
  guard = guardFromFiles({ basePath: baseFile, basePagesPath: argument('--base-pages'), approvalPath: argument('--approval'),
    head: readHeadBaseline(), pageIds, approvers, readText: file => readFileSync(file, 'utf8') });
} else if (!dryRun) {
  guard = await baselineGuard({ request, repoApi: api, repository: env.GITHUB_REPOSITORY, prNumber: env.A11Y_PR_NUMBER,
    checkedOut: env.A11Y_CHECKOUT_SHA, payloadBase: env.A11Y_BASE_SHA, headRef: env.A11Y_HEAD_REF, approvers, head: readHeadBaseline(), pageIds });
}
if (guard?.error) {
  process.stderr.write(`a11y-pr-comment: baseline growth unknown: ${guard.error}\n`);
}

const body = renderComment(comparison, {
  reportUrl: env.A11Y_REPORT_URL || undefined,
  runUrl: env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
    ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
    : undefined,
  checkUrl: env.A11Y_CHECK_URL || undefined,
  guard,
});

if (dryRun) {
  process.stdout.write(`${body}\n`);
  process.exit(0);
}

const result = await upsertComment({ request, repoApi: api, prNumber: env.A11Y_PR_NUMBER, body });

process.stdout.write(`a11y-pr-comment: ${result.action} ${result.url}\n`);
