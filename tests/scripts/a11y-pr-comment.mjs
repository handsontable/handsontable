/**
 * Posts or edits the axe scan's sticky comment on the pull request.
 *
 * Reads `test-results/a11y/comparison.json` (the a11y reporter writes it), builds the
 * body through `lib/a11y-pr-comment.mjs`, and finds the comment it posted before: the
 * one whose author is the Actions bot and whose body carries `COMMENT_MARKER` (anyone
 * can paste the marker, so the author decides). When something needs action it edits
 * that comment or posts a new one; when the run is clean it edits an existing comment
 * to say so and posts nothing new. Run by `.github/workflows/a11y.yml` on a pull
 * request, behind the fork guard (a fork's token cannot comment) and with
 * `continue-on-error`. It talks to the REST API with `fetch`: the job's Playwright
 * container has no `gh`.
 *
 * Environment: `GITHUB_TOKEN` (with `pull-requests: write`), `GITHUB_REPOSITORY`,
 * `A11Y_PR_NUMBER`, and optionally `A11Y_REPORT_URL`, `A11Y_CHECK_URL`, `GITHUB_API_URL`,
 * `GITHUB_SERVER_URL` and `GITHUB_RUN_ID`. `--dry-run` prints the body instead.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMENT_MARKER, renderComment, shouldComment } from '../lib/a11y-pr-comment.mjs';

const BOT_LOGIN = 'github-actions[bot]';
const COMPARISON = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../test-results/a11y/comparison.json');
const env = process.env;
const comparison = existsSync(COMPARISON) ? JSON.parse(readFileSync(COMPARISON, 'utf8')) : null;

if (!comparison) {
  process.stderr.write('a11y-pr-comment: the scan wrote no comparison.json, so there is nothing to say; the check run reports it.\n');
  process.exit(0);
}

const body = renderComment(comparison, {
  reportUrl: env.A11Y_REPORT_URL || undefined,
  runUrl: env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
    ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
    : undefined,
  checkUrl: env.A11Y_CHECK_URL || undefined,
});

if (process.argv.includes('--dry-run')) {
  process.stdout.write(`${body}\n`);
  process.exit(0);
}
for (const name of ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'A11Y_PR_NUMBER']) {
  if (!env[name]) {
    process.stderr.write(`a11y-pr-comment: ${name} is not set, so no comment was posted.\n`);
    process.exit(1);
  }
}

const api = `${env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}`;

/**
 * Sends one REST request and returns its JSON body, throwing on an error status.
 *
 * @param {string} url The URL.
 * @param {string} [method] The method.
 * @param {object} [payload] The body.
 * @returns {Promise<any>} The response body.
 */
async function send(url, method = 'GET', payload) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    throw new Error(`${method} ${url} answered ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

let existing = null;

for (let page = 1; !existing; page += 1) {
  const comments = await send(`${api}/issues/${env.A11Y_PR_NUMBER}/comments?per_page=100&page=${page}`);

  existing = comments.find(comment => comment.user?.login === BOT_LOGIN && comment.body?.includes(COMMENT_MARKER)) ?? null;
  if (comments.length < 100) {
    break;
  }
}

if (existing) {
  await send(`${api}/issues/comments/${existing.id}`, 'PATCH', { body });
  process.stdout.write(`a11y-pr-comment: edited ${existing.html_url}\n`);
} else if (shouldComment(comparison)) {
  const created = await send(`${api}/issues/${env.A11Y_PR_NUMBER}/comments`, 'POST', { body });

  process.stdout.write(`a11y-pr-comment: posted ${created.html_url}\n`);
} else {
  process.stdout.write('a11y-pr-comment: nothing needs action and there is no earlier comment, so nothing was posted.\n');
}
