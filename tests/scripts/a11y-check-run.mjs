/**
 * Posts the `A11y / axe report` check run for the commit the axe job scanned.
 *
 * Reads `test-results/a11y/comparison.json` (the a11y reporter writes it), builds the payload
 * through `lib/a11y-check-run.mjs`, and creates the check run through the Checks API
 * (`lib/github-check-run.mjs`, which adds annotations past the first 50 in further requests). Run
 * by `.github/workflows/a11y.yml` after the scan, behind the fork guard (a fork's token cannot
 * write checks) and with `continue-on-error`: the check run reports, it never decides the job.
 * The verdict follows the severity rule (`lib/a11y-verdict.mjs`); what counts follows the event
 * (`GITHUB_EVENT_NAME`: a schedule or a dispatch is an audit, anything else a change) and the
 * cluster catalog (`a11y/issues.json`: on a change run a tracked finding is a warning at most).
 *
 * Environment: `GITHUB_TOKEN` (with `checks: write`), `GITHUB_REPOSITORY`,
 * `A11Y_HEAD_SHA` (the pull request's head, not the merge commit, or the check
 * does not show on the pull request), and optionally `A11Y_REPORT_URL`,
 * `GITHUB_API_URL`, `GITHUB_SERVER_URL`, `GITHUB_EVENT_NAME` and `GITHUB_RUN_ID` (stamped on the
 * check run as its `external_id`, which the run verdict reads).
 *
 * `--dry-run` prints the payload instead of posting it, and needs none of them. A posted check
 * run's URL goes to the step output `check-url`, which the pull request comment links. `--suite docs` reports the
 * docs site scan instead (`.github/workflows/docs-a11y.yml`): `A11y / docs-axe report`, from
 * `test-results/a11y-docs/comparison.json`, annotated on the docs page list and baseline. On a change run of the docs
 * scan, a new finding develop's latest docs audit also saw is baseline drift and a warning at most
 * (`lib/a11y-docs-drift.mjs`): the poster reads that audit from the findings ledger (`A11Y_LEDGER_URL`, the published
 * `a11y.json` by default) and, with `GITHUB_TOKEN`, when the staging deploy last finished, to say when the audit is
 * older than the deploy the run read.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCS_SCAN, PRODUCT_SCAN, baselineLines, buildCheckRun, docsPageLines, pageLines } from '../lib/a11y-check-run.mjs';
import { LEDGER_URL, docsAudit, driftNotes, driftOf } from '../lib/a11y-docs-drift.mjs';
import { verdictInputs } from '../lib/a11y-verdict-inputs.mjs';
import { postCheckRun } from '../lib/github-check-run.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
const dryRun = process.argv.includes('--dry-run');
const suite = process.argv.includes('--suite') ? process.argv[process.argv.indexOf('--suite') + 1] : 'product';

if (!['product', 'docs'].includes(suite)) {
  process.stderr.write(`a11y-check-run: --suite must be product or docs, got ${JSON.stringify(suite)}\n`);
  process.exit(2);
}

const scan = suite === 'docs' ? DOCS_SCAN : PRODUCT_SCAN;
const fromTests = file => path.join(TESTS_ROOT, file.replace(/^tests\//, ''));
const COMPARISON = fromTests(scan.comparison);
const runUrl = env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
  ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
  : undefined;
const { scope, tracked, externalId, notes } = verdictInputs({ env, testsRoot: TESTS_ROOT });
const comparison = existsSync(COMPARISON) ? JSON.parse(readFileSync(COMPARISON, 'utf8')) : null;
const pagesSource = readFileSync(fromTests(scan.pagesFile), 'utf8');
// The docs guide pages have no entry of their own (`guidePages()` builds them), so they are annotated on the function
// that does. The page list is loaded for the docs only: it reads the docs visual list and every guide's source.
const pages = scan === DOCS_SCAN
  ? docsPageLines(pagesSource, (await import('../a11y/docs/pages.mjs')).DOCS_PAGES.map(page => page.id))
  : pageLines(pagesSource);
// On a change run of the docs scan, a new finding develop's latest docs audit also saw is baseline drift, a warning
// at most; a grown one never is (`lib/a11y-docs-drift.mjs`). `A11Y_LEDGER_FILE` reads a saved ledger instead, for a
// dry run.
let drift = () => false;
const driftLines = [];

if (scan === DOCS_SCAN && scope === 'change' && comparison) {
  const counted = comparison.newViolations ?? [];
  const source = env.A11Y_LEDGER_FILE || env.A11Y_LEDGER_URL || LEDGER_URL;
  let audit = null;
  let problem = null;

  try {
    audit = docsAudit(await readLedger(source));
  } catch (error) {
    problem = `${source}: ${error instanceof Error ? error.message : String(error)}`;
  }
  drift = driftOf(audit, comparison);
  driftLines.push(...driftNotes({ audit, problem, drift: counted.filter(drift).length, counted: counted.length, grown: (comparison.grown ?? []).length,
    deployedAt: await stagingDeployedAt() }));
}

const payload = buildCheckRun({
  comparison: comparison && { ...comparison, notes: [...(comparison.notes ?? []), ...notes, ...driftLines] },
  pages,
  baseline: baselineLines(readFileSync(fromTests(scan.baselineFile), 'utf8')),
  reportUrl: env.A11Y_REPORT_URL || undefined,
  runUrl,
  scope,
  tracked,
  scan,
  drift,
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
  externalId,
  apiUrl: env.GITHUB_API_URL,
});

process.stdout.write(`a11y-check-run: posted "${payload.name}" (${payload.conclusion}): ${payload.title}\n${created.html_url}\n`);
// The pull request comment links the check run.
if (env.GITHUB_OUTPUT) {
  appendFileSync(env.GITHUB_OUTPUT, `check-url=${created.html_url}\n`);
}

/**
 * The findings ledger, from a saved file or its published URL.
 *
 * @param {string} source A file path (`A11Y_LEDGER_FILE`) or a URL.
 * @returns {Promise<unknown>} The parsed ledger.
 */
async function readLedger(source) {
  if (env.A11Y_LEDGER_FILE) {
    return JSON.parse(readFileSync(source, 'utf8'));
  }

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * When the last successful staging deploy of the docs finished (`Docs Staging Deployment` on develop), so the check run
 * can say when the audit is older than the deploy the run read. `null` without a token, for a run that read another
 * deploy, or when the API does not answer: the check run then says nothing about it.
 *
 * @returns {Promise<string|null>} The time, ISO 8601.
 */
async function stagingDeployedAt() {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY || env.DOCS_A11Y_BASE_URL) {
    return null;
  }
  try {
    const response = await fetch(`${env.GITHUB_API_URL || 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}/actions/workflows/docs-staging.yml/runs`
      + '?branch=develop&status=success&per_page=1', { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } });

    return response.ok ? ((await response.json()).workflow_runs?.[0]?.updated_at ?? null) : null;
  } catch {
    return null;
  }
}
