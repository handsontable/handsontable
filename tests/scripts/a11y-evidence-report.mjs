/**
 * Writes the job summary of the accessibility checks beyond axe and posts one `A11y / <check> report`
 * check run per check.
 *
 * Reads every evidence document the reporter (`reporters/a11y-checks.ts`) left in
 * `test-results/a11y-checks/<check>.json`, validates it (`validateEvidence()`), and builds each check's
 * summary and check run through `lib/a11y-evidence.mjs`. By default it appends the summaries to the
 * GitHub job summary when `GITHUB_STEP_SUMMARY` is set. With `--check-run` it posts the check runs
 * through the Checks API (`lib/github-check-run.mjs`), behind the fork guard in
 * `.github/workflows/a11y.yml`, with `continue-on-error`. `--dry-run` prints the payloads instead and
 * needs no token. A finding never fails a test or the job; each check run follows the severity verdict
 * (`lib/a11y-verdict.mjs`), and what counts follows the event (`GITHUB_EVENT_NAME`: a schedule or a
 * dispatch is an audit, anything else a change) and the cluster catalog (`a11y/issues.json`).
 *
 * Environment: `HOT_A11Y_SITE` (a site's checks instead of the product's: its registry, `SITE_CHECKS` of
 * `lib/a11y-site-checks.mjs`, its folder `test-results/a11y-<site>-checks/`, its page list for the annotations, and
 * the `<site>-checks` finding source the catalog files them under), `HOT_A11Y_CHECKS_SUITE` (the suite the job ran: a
 * check of it that left no document gets a red tooling check run instead of none; `A11Y_CHECKS`, comma-separated,
 * names the checks instead, and an entry that is no check id ends the script before a check run is posted, as it
 * ends the config),
 * `A11Y_EVIDENCE_URL` (the uploaded evidence artifact),
 * and for the post `GITHUB_TOKEN` (with `checks: write`), `GITHUB_REPOSITORY` and `A11Y_HEAD_SHA` (the
 * pull request's head on a pull request, `github.sha` otherwise), plus the optional `GITHUB_API_URL`,
 * `GITHUB_SERVER_URL`, `GITHUB_EVENT_NAME` and `GITHUB_RUN_ID` (stamped on each check run as its
 * `external_id`, which the run verdict reads).
 *
 * On a pull request (`GITHUB_EVENT_NAME` is `pull_request`) the product checks read the findings ledger as their
 * baseline (`lib/a11y-pr-ledger.mjs`): a finding whose ledger row is open is known and does not count, a resolved row
 * is a regression and a missing one is new. The ledger is read from `A11Y_LEDGER_URL` (the published `a11y.json` by
 * default) or `A11Y_LEDGER_FILE` (a saved copy, which also turns the ledger on for a local run), and the pull request's
 * changed files from the API (`A11Y_PR_NUMBER` with `GITHUB_TOKEN`) or `A11Y_CHANGED_FILES` (a file of paths, one per
 * line), so a new finding on a page the pull request did not change is marked so. A ledger that does not load leaves
 * every finding counted, with a note; unknown files mark nothing.
 *
 * On an audit (`GITHUB_EVENT_NAME` is `schedule` or `workflow_dispatch`) every check, the product's and a site's, reads
 * the same ledger as the audit before left it (`auditLedgerInput()` of `lib/a11y-verdict-inputs.mjs`, from the same two
 * variables): every finding stays listed, known debt and a finding on a target the audit before did not measure are a
 * warning at most, and a regression or a new finding counts, so the run turns red on what changed since that audit.
 */
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeMarkdownText } from '../lib/a11y-baseline.mjs';
import { pageLinesOf } from '../lib/a11y-check-run.mjs';
import {
  EVIDENCE_CHECKS, PAGES_FILE, auditLedgerSectionOf, buildEvidenceCheckRun, checksForRun, ledgerSectionOf, renderEvidenceSummary, validateEvidence,
} from '../lib/a11y-evidence.mjs';
import { LEDGER_URL, ledgerIndex, pagesTouched, prLedgerOf, sharedSourceFolders } from '../lib/a11y-pr-ledger.mjs';
import { siteChecks, siteOf, siteOutputDir } from '../lib/a11y-site-checks.mjs';
import { VERDICT_RULE } from '../lib/a11y-verdict.mjs';
import { auditLedgerInput, verdictInputs } from '../lib/a11y-verdict-inputs.mjs';
import { postCheckRun } from '../lib/github-check-run.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The files API lists at most 3,000 files of a pull request, in pages of 100.
const FILES_PAGES = 30;
const env = process.env;
// A site's checks read like the product's, from a registry, a folder and a page list of their own.
const site = env.HOT_A11Y_SITE ? siteOf(env.HOT_A11Y_SITE) : null;
const CHECKS = site ? siteChecks(site) : EVIDENCE_CHECKS;
const FOLDER = site ? siteOutputDir(site) : 'test-results/a11y-checks';
const PAGE_LIST = site ? `tests/a11y/${site}/pages.mjs` : PAGES_FILE;
const SOURCE = site ? `${site}-checks` : 'checks';
// `A11Y_EVIDENCE_DIR` exists for `e2e/a11y-checks-reporter.spec.ts`, which runs this on a synthetic run's output.
const OUTPUT_DIR = env.A11Y_EVIDENCE_DIR ? path.resolve(env.A11Y_EVIDENCE_DIR) : path.join(TESTS_ROOT, FOLDER);
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const postRun = args.has('--check-run');
const runUrl = env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
  ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
  : undefined;
const artifactUrl = env.A11Y_EVIDENCE_URL || undefined;
const pagesSource = readFileSync(path.join(TESTS_ROOT, PAGE_LIST.replace(/^tests\//, '')), 'utf8');
// A page is annotated on the line its site's scan annotates it on (`pageLinesOf()`): the docs build most pages in
// `guidePages()`, and most website pages take their id from the route, so neither has an `id:` line of its own.
const pages = pageLinesOf(site ?? 'product', pagesSource, site === 'docs' ? (await import('../a11y/docs/pages.mjs')).DOCS_PAGES.map(page => page.id) : []);
// Playwright keeps its own `.last-run.json` in the same folder; a check's document never starts with a dot.
const files = existsSync(OUTPUT_DIR) ? readdirSync(OUTPUT_DIR).filter(name => name.endsWith('.json') && !name.startsWith('.')).sort() : [];
// The checks the run covered, read the way the config read them (`checksForRun()`: the ones `A11Y_CHECKS`
// names, otherwise the suite's), so a subset that names no check is refused here too, before a check run
// is posted for a check that does not exist, and a check named twice is expected once.
let expected;

try {
  expected = checksForRun(env, CHECKS);
} catch (error) {
  process.stderr.write(`a11y-evidence-report: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
const reports = files.map((name) => {
  const check = name.slice(0, -'.json'.length);

  try {
    const doc = JSON.parse(readFileSync(path.join(OUTPUT_DIR, name), 'utf8'));

    return { check, doc, problems: validateEvidence(doc, { checks: CHECKS }).map(problem => `${name}: ${problem}`) };
  } catch (error) {
    return { check, doc: null, problems: [`${name} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`] };
  }
});

for (const check of expected.filter(name => !reports.some(report => report.check === name))) {
  reports.push({ check, doc: null, problems: [`the ${check} check left no ${FOLDER}/${check}.json: no test of it ran to the end`] });
}

const { scope, tracked, externalId, notes } = verdictInputs({ env, testsRoot: TESTS_ROOT });
// The product checks on a pull request, or a local change run given a saved ledger: the ledger tells new from known.
const prLedger = scope !== 'audit' && !site && (env.GITHUB_EVENT_NAME === 'pull_request' || env.A11Y_LEDGER_FILE) ? await readPrLedger() : undefined;
// Every check on an audit: the ledger as the audit before left it tells what changed since from the debt that stands.
const auditLedger = await auditLedgerInput({ env, scope, source: SOURCE });
const payloads = reports.map(report => buildEvidenceCheckRun({
  ...report, pages, runUrl, artifactUrl, scope, tracked, pagesFile: PAGE_LIST, source: SOURCE, prLedger, auditLedger,
}));
const ROW = { success: '✔ green', neutral: '⚠ warning', failure: '✖ red' };
const COUNTING_OF_SCOPE = {
  audit: auditLedger?.classify
    ? 'an audit run: every finding is listed, and one the findings ledger does not hold as open counts (a new one, or a regression); known debt, '
      + 'and a finding on a target the audit before did not measure, is a warning at most'
    : 'an audit run: every open finding counts',
  change: 'a change run: a tracked finding is a warning at most',
};
// A subset run names what ran, so nobody reads the missing checks as clean: the ledger resolves a row only
// where its check measured, the run verdict expects the named checks only, and the summary says the same.
const subsetLine = env.A11Y_CHECKS
  ? [`A subset run: ${escapeMarkdownText(expected.join(', '))} (the \`checks\` input). The other checks did not run and measured nothing.`, '']
  : [];
const summary = [
  site ? `## A11y: the ${site} site checks beyond axe` : '## A11y: the checks beyond axe',
  '',
  ...subsetLine,
  `Each check's verdict follows the severity rule ${VERDICT_RULE}, on ${COUNTING_OF_SCOPE[scope]}. `
    + 'Its check run carries the verdict; this job never fails on a finding.',
  '',
  ...(auditLedger?.problem ? [`> Known and new findings were not told apart, so every open finding counts: ${escapeMarkdownText(auditLedger.problem)}.`, ''] : []),
  ...(prLedger?.classify
    ? ['On a pull request the findings ledger is the baseline: a finding it holds as open is known and does not count; a regression or a new finding does.', '']
    : []),
  ...(prLedger?.problem ? [`> Known and new findings were not told apart, so every finding counts: ${escapeMarkdownText(prLedger.problem)}.`, ''] : []),
  ...notes.map(note => `> ${escapeMarkdownText(note)}\n`),
  '| Verdict | Check run | Title |',
  '| --- | --- | --- |',
  ...payloads.map(payload => `| ${ROW[payload.conclusion]} | ${escapeMarkdownText(payload.name)} | ${escapeMarkdownText(payload.title)} |`),
  '',
  ...reports.map((report, index) => (report.doc && report.problems.length === 0
    ? [renderEvidenceSummary(report.doc, { runUrl, artifactUrl }), ledgerSectionOf(report.doc, prLedger), auditLedgerSectionOf(report.doc, auditLedger)]
      .filter(Boolean).join('\n')
    : `### ${payloads[index].name}\n\n${payloads[index].summary}\n`)),
].join('\n');

for (const payload of payloads) {
  process.stdout.write(`a11y-evidence-report: ${payload.name} (${payload.conclusion}): ${payload.title}\n`);
}

if (dryRun) {
  process.stdout.write(`${JSON.stringify(payloads.map(payload => ({ ...payload, summary: undefined })), null, 2)}\n`);
  process.exit(0);
}

if (!postRun) {
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
  process.exit(0);
}

for (const name of ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'A11Y_HEAD_SHA']) {
  if (!env[name]) {
    process.stderr.write(`a11y-evidence-report: ${name} is not set, so no check run was posted.\n`);
    process.exit(1);
  }
}

// One check run the API refuses does not cost the checks after it theirs; the step still ends red.
let refused = 0;

for (const payload of payloads) {
  try {
    const created = await postCheckRun({
      token: env.GITHUB_TOKEN,
      repository: env.GITHUB_REPOSITORY,
      headSha: env.A11Y_HEAD_SHA,
      payload,
      detailsUrl: artifactUrl || runUrl,
      externalId,
      apiUrl: env.GITHUB_API_URL,
    });

    process.stdout.write(`a11y-evidence-report: posted "${payload.name}" (${payload.conclusion})\n${created.html_url}\n`);
  } catch (error) {
    refused += 1;
    process.stderr.write(`a11y-evidence-report: "${payload.name}" was not posted: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

if (refused > 0) {
  process.exit(1);
}

/**
 * The findings ledger as a pull request's baseline: the ledger's index of the product checks' rows, and the pages the
 * pull request touches, read from its changed files. A ledger that does not load is a problem the check runs state;
 * changed files that cannot be read mark no page.
 *
 * @returns {Promise<object>} The input `buildEvidenceCheckRun()` takes as `prLedger`.
 */
async function readPrLedger() {
  let index;

  try {
    const ledger = env.A11Y_LEDGER_FILE ? JSON.parse(readFileSync(env.A11Y_LEDGER_FILE, 'utf8')) : await fetchJson(env.A11Y_LEDGER_URL || LEDGER_URL);

    index = ledgerIndex(ledger, SOURCE);
  } catch (error) {
    return { problem: `the findings ledger did not load (${error instanceof Error ? error.message : String(error)})` };
  }

  const files = await changedFiles();
  const [{ A11Y_PAGES }, { PLUGIN_COVERAGE, EDITOR_COVERAGE }] = await Promise.all([import('../a11y/pages.mjs'), import('../a11y/coverage.mjs')]);
  const touched = files ? pagesTouched(files, {
    pages: A11Y_PAGES, plugins: PLUGIN_COVERAGE, editors: EDITOR_COVERAGE, shared: sharedSourceFolders(path.join(TESTS_ROOT, '../handsontable/src')),
  }) : null;

  return prLedgerOf({ index, touched, catalog: new Set(A11Y_PAGES.map(page => page.id)), source: SOURCE });
}

/**
 * The pull request's changed files: from `A11Y_CHANGED_FILES` (a file, one path per line), or through the API, or
 * `null` when neither is at hand or the API refuses.
 *
 * @returns {Promise<string[]|null>} The paths.
 */
async function changedFiles() {
  if (env.A11Y_CHANGED_FILES) {
    return readFileSync(env.A11Y_CHANGED_FILES, 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
  }
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY || !/^\d+$/.test(env.A11Y_PR_NUMBER ?? '')) {
    return null;
  }

  const files = [];

  try {
    // The API lists at most 3,000 files, 100 a page.
    for (let page = 1; page <= FILES_PAGES; page += 1) {
      const batch = await fetchJson(`${env.GITHUB_API_URL || 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}/pulls/${env.A11Y_PR_NUMBER}/files?per_page=100&page=${page}`,
        { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' });

      files.push(...batch.map(file => file.filename));
      if (batch.length < 100) {
        break;
      }
    }
  } catch (error) {
    process.stderr.write(`a11y-evidence-report: the pull request's files were not read: ${error instanceof Error ? error.message : String(error)}\n`);

    return null;
  }
  // At the API's limit the list may be cut, and a file left out would mark its page as unchanged: read none.
  if (files.length >= FILES_PAGES * 100) {
    process.stderr.write(`a11y-evidence-report: the pull request lists ${files.length} files, the API's limit, so the list may be cut; no page is marked as unchanged.\n`);

    return null;
  }

  return files;
}

/**
 * Fetches a URL's JSON.
 *
 * @param {string} url The URL.
 * @param {Record<string, string>} [headers] The headers.
 * @returns {Promise<any>} The parsed body.
 */
async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }

  return response.json();
}
