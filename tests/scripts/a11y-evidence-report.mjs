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
 * needs no token. A check run is never a failure: the checks are report-only.
 *
 * Environment: `A11Y_CHECKS` (the checks the job ran, comma-separated: one that left no document gets a
 * neutral tooling check run instead of none), `A11Y_EVIDENCE_URL` (the uploaded evidence artifact),
 * and for the post `GITHUB_TOKEN` (with `checks: write`), `GITHUB_REPOSITORY` and `A11Y_HEAD_SHA` (the
 * pull request's head on a pull request, `github.sha` otherwise), plus the optional `GITHUB_API_URL`,
 * `GITHUB_SERVER_URL` and `GITHUB_RUN_ID`.
 */
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageLines } from '../lib/a11y-check-run.mjs';
import { buildEvidenceCheckRun, renderEvidenceSummary, validateEvidence } from '../lib/a11y-evidence.mjs';
import { postCheckRun } from '../lib/github-check-run.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
// `A11Y_EVIDENCE_DIR` exists for `e2e/a11y-checks-reporter.spec.ts`, which runs this on a synthetic run's output.
const OUTPUT_DIR = env.A11Y_EVIDENCE_DIR ? path.resolve(env.A11Y_EVIDENCE_DIR) : path.join(TESTS_ROOT, 'test-results/a11y-checks');
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const postRun = args.has('--check-run');
const runUrl = env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
  ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
  : undefined;
const artifactUrl = env.A11Y_EVIDENCE_URL || undefined;
const pages = pageLines(readFileSync(path.join(TESTS_ROOT, 'a11y/pages.mjs'), 'utf8'));
// Playwright keeps its own `.last-run.json` in the same folder; a check's document never starts with a dot.
const files = existsSync(OUTPUT_DIR) ? readdirSync(OUTPUT_DIR).filter(name => name.endsWith('.json') && !name.startsWith('.')).sort() : [];
const expected = (env.A11Y_CHECKS ?? '').split(',').map(name => name.trim()).filter(Boolean);
const reports = files.map((name) => {
  const check = name.slice(0, -'.json'.length);

  try {
    const doc = JSON.parse(readFileSync(path.join(OUTPUT_DIR, name), 'utf8'));

    return { check, doc, problems: validateEvidence(doc).map(problem => `${name}: ${problem}`) };
  } catch (error) {
    return { check, doc: null, problems: [`${name} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`] };
  }
});

for (const check of expected.filter(name => !reports.some(report => report.check === name))) {
  reports.push({ check, doc: null, problems: [`the ${check} check left no test-results/a11y-checks/${check}.json: no test of it ran to the end`] });
}

const payloads = reports.map(report => buildEvidenceCheckRun({ ...report, pages, runUrl, artifactUrl }));
const summary = [
  '## A11y: the checks beyond axe',
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

for (const payload of payloads) {
  const created = await postCheckRun({
    token: env.GITHUB_TOKEN,
    repository: env.GITHUB_REPOSITORY,
    headSha: env.A11Y_HEAD_SHA,
    payload,
    detailsUrl: artifactUrl || runUrl,
    apiUrl: env.GITHUB_API_URL,
  });

  process.stdout.write(`a11y-evidence-report: posted "${payload.name}" (${payload.conclusion})\n${created.html_url}\n`);
}
