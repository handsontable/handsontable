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
 * scan, a new finding develop's latest docs audit also saw, or a grown one it counted at least as many nodes for, is
 * baseline drift and a warning at most
 * (`lib/a11y-docs-drift.mjs`): the poster reads that audit from the findings ledger (`A11Y_LEDGER_URL`, the published
 * `a11y.json` by default) and, with `GITHUB_TOKEN`, when the staging deploy last finished, to say when the audit is
 * older than the deploy the run read. `--suite website` reports the website scan the same way
 * (`.github/workflows/website-a11y.yml`): `A11y / website-axe report`, from `test-results/a11y-website/comparison.json`,
 * with the same drift rule against the latest website audit, which reads production as a change run does.
 *
 * On a pull request (`A11Y_PR_NUMBER`) the product scan's check run also judges what the pull request adds to the
 * baseline (`lib/a11y-baseline-guard.mjs`): it reads the base commit's baseline and page list at the checked-out merge
 * commit's first parent (`A11Y_CHECKOUT_SHA`, `A11Y_BASE_SHA` as the fallback), and, when the baseline grew, the
 * `a11y-exception-approved` label from the pull request's events and the baseline at the head the label approved (the
 * latest pull request run of `A11Y_HEAD_REF` created before the label). `A11Y_EXCEPTION_APPROVERS` (comma-separated
 * logins) limits who may approve; empty, anyone who can label the pull request may. A dry run judges from files:
 * `--base <file>` (the baseline at the merge base), `--base-pages <file>` (`tests/a11y/pages.mjs` there) and
 * `--approval <file>` (`{"by", "at", "baseline"}`, standing in for the label; `guardFromFiles()`).
 *
 * On an audit (a schedule or a dispatch) every scan reads the findings ledger as the audit before left it
 * (`auditLedgerInput()` of `lib/a11y-verdict-inputs.mjs`: `A11Y_LEDGER_FILE`, or `A11Y_LEDGER_URL`, the published
 * `a11y.json` by default): every open finding stays listed, known debt is a warning at most, and a regression or a new
 * finding counts, so the run turns red on what changed since that audit. A ledger that does not load leaves every open
 * finding counted, with a note.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { approverList, baselineGuard, guardFromFiles } from '../lib/a11y-baseline-guard.mjs';
import { DOCS_SCAN, PRODUCT_SCAN, WEBSITE_SCAN, baselineLines, buildCheckRun, pageLines, pageLinesOf } from '../lib/a11y-check-run.mjs';
import { LEDGER_URL, auditStaleness, driftNotes, driftOf, siteAudit } from '../lib/a11y-docs-drift.mjs';
import { auditLedgerInput, verdictInputs } from '../lib/a11y-verdict-inputs.mjs';
import { postCheckRun } from '../lib/github-check-run.mjs';
import { restClient } from '../lib/github-rest.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
const dryRun = process.argv.includes('--dry-run');
const argument = name => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);
const suite = argument('--suite') ?? 'product';

const SCANS = { product: PRODUCT_SCAN, docs: DOCS_SCAN, website: WEBSITE_SCAN };

if (!Object.hasOwn(SCANS, suite)) {
  process.stderr.write(`a11y-check-run: --suite must be product, docs or website, got ${JSON.stringify(suite)}\n`);
  process.exit(2);
}

const scan = SCANS[suite];
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
const pages = pageLinesOf(suite, pagesSource, suite === 'docs' ? (await import('../a11y/docs/pages.mjs')).DOCS_PAGES.map(page => page.id) : []);
// On a change run of a site's scan, a new finding the site's latest audit also saw is baseline drift, a warning at
// most, and so is a grown one the audit counted at least as many nodes for (`lib/a11y-docs-drift.mjs`).
// `A11Y_LEDGER_FILE` reads a saved ledger instead, for a dry run.
let drift = () => false;
const driftLines = [];

if (scan !== PRODUCT_SCAN && scope === 'change' && comparison) {
  const counted = [...(comparison.newViolations ?? []), ...(comparison.grown ?? [])];
  const source = env.A11Y_LEDGER_FILE || env.A11Y_LEDGER_URL || LEDGER_URL;
  let audit = null;
  let problem = null;

  try {
    audit = siteAudit(await readLedger(source), suite);
  } catch (error) {
    problem = `${source}: ${error instanceof Error ? error.message : String(error)}`;
  }
  // The docs staging deploy's time is read from this repository's runs; production's website deploys are not.
  const deployedAt = suite === 'docs' ? await stagingDeployedAt() : null;

  // The ledger keeps when an audit finished; a deploy inside the run is what makes it stale, so read when it started.
  const staleness = await auditStaleness({ audit, deployedAt, readStart: auditStartedAt });

  audit = staleness.audit;
  drift = driftOf(audit, comparison, { stale: staleness.stale });

  const grownCounted = (comparison.grown ?? []).filter(item => !drift(item));

  driftLines.push(...driftNotes({ audit, problem, drift: counted.filter(drift).length, counted: counted.length,
    grown: grownCounted.length, grownItems: grownCounted, deployedAt, site: suite }));
}

const guard = scan === PRODUCT_SCAN ? await judgeBaselineGrowth() : undefined;

if (guard?.error) {
  process.stderr.write(`a11y-check-run: the baseline growth was not judged: ${guard.error}\n`);
}

// On an audit, the ledger as the audit before left it tells what changed since from the debt that stands.
const auditLedger = await auditLedgerInput({ env, scope, source: scan.source });
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
  auditLedger,
  guard,
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
 * What the pull request adds to the baseline, judged: from files on a dry run with `--base`, through the API on a pull
 * request, and nothing on any other run (an audit or a push has no base to compare with).
 *
 * @returns {Promise<object|undefined>} What `guardOf()` returns, or nothing.
 */
async function judgeBaselineGrowth() {
  const baselinePath = fromTests(PRODUCT_SCAN.baselineFile);
  let head = null;

  try {
    head = JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch {
    // The reporter has reported an unreadable baseline as a tooling problem already; the growth says it was not read.
  }

  const pageIds = source => pageLines(source).keys();
  const approvers = approverList(env.A11Y_EXCEPTION_APPROVERS);

  if (argument('--base')) {
    return guardFromFiles({ basePath: argument('--base'), basePagesPath: argument('--base-pages'), approvalPath: argument('--approval'),
      head, pageIds, approvers, readText: file => readFileSync(file, 'utf8') });
  }
  if (dryRun || !env.A11Y_PR_NUMBER) {
    return undefined;
  }

  return baselineGuard({
    request: restClient({ token: env.GITHUB_TOKEN }),
    repoApi: `${env.GITHUB_API_URL || 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}`,
    repository: env.GITHUB_REPOSITORY,
    prNumber: env.A11Y_PR_NUMBER,
    checkedOut: env.A11Y_CHECKOUT_SHA,
    payloadBase: env.A11Y_BASE_SHA,
    headRef: env.A11Y_HEAD_REF,
    approvers,
    head,
    pageIds,
  });
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
 * When an audit's run started (`run_started_at` of the run, the latest attempt's start on a re-run), so the check run can
 * tell a deploy that landed during the audit from one that landed after it. `null` without a token or when the API does
 * not answer: the finish time the ledger keeps then decides, as before.
 *
 * @param {string} runId The audit's run id, from the ledger.
 * @returns {Promise<string|null>} The time, ISO 8601.
 */
async function auditStartedAt(runId) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY || !/^\d+$/.test(String(runId))) {
    return null;
  }
  try {
    const response = await fetch(`${env.GITHUB_API_URL || 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}/actions/runs/${runId}`,
      { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } });

    return response.ok ? ((await response.json()).run_started_at ?? null) : null;
  } catch {
    return null;
  }
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
