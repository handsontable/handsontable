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
 */
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeMarkdownText } from '../lib/a11y-baseline.mjs';
import { docsPageLines, pageLines } from '../lib/a11y-check-run.mjs';
import { EVIDENCE_CHECKS, PAGES_FILE, buildEvidenceCheckRun, checksForRun, renderEvidenceSummary, validateEvidence } from '../lib/a11y-evidence.mjs';
import { siteChecks, siteOf, siteOutputDir } from '../lib/a11y-site-checks.mjs';
import { VERDICT_RULE } from '../lib/a11y-verdict.mjs';
import { verdictInputs } from '../lib/a11y-verdict-inputs.mjs';
import { postCheckRun } from '../lib/github-check-run.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
// The docs build most pages in `guidePages()`, with no `id:` line of their own: those are annotated on that line, as
// the docs scan's check run annotates them (`docsPageLines()`).
const pages = site === 'docs'
  ? docsPageLines(pagesSource, (await import('../a11y/docs/pages.mjs')).DOCS_PAGES.map(page => page.id))
  : pageLines(pagesSource);
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
const payloads = reports.map(report => buildEvidenceCheckRun({ ...report, pages, runUrl, artifactUrl, scope, tracked, pagesFile: PAGE_LIST, source: SOURCE }));
const ROW = { success: '✔ green', neutral: '⚠ warning', failure: '✖ red' };
// A subset run names what ran, so nobody reads the missing checks as clean: the ledger resolves a row only
// where its check measured, the run verdict expects the named checks only, and the summary says the same.
const subsetLine = env.A11Y_CHECKS
  ? [`A subset run: ${escapeMarkdownText(expected.join(', '))} (the \`checks\` input). The other checks did not run and measured nothing.`, '']
  : [];
const summary = [
  site ? `## A11y: the ${site} site checks beyond axe` : '## A11y: the checks beyond axe',
  '',
  ...subsetLine,
  `Each check's verdict follows the severity rule ${VERDICT_RULE}, on ${scope === 'audit' ? 'an audit run: every open finding counts' : 'a change run: a tracked finding is a warning at most'}. `
    + 'Its check run carries the verdict; this job never fails on a finding.',
  '',
  ...notes.map(note => `> ${escapeMarkdownText(note)}\n`),
  '| Verdict | Check run | Title |',
  '| --- | --- | --- |',
  ...payloads.map(payload => `| ${ROW[payload.conclusion]} | ${escapeMarkdownText(payload.name)} | ${escapeMarkdownText(payload.title)} |`),
  '',
  ...reports.map((report, index) => (report.doc && report.problems.length === 0
    ? renderEvidenceSummary(report.doc, { runUrl, artifactUrl })
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
