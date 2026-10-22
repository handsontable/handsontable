/**
 * Writes the screen reader job summary and posts the `Screen reader / <project> report` check run.
 *
 * Reads every transcript the spec left in `test-results/screenreader/transcripts/` and the scenario
 * files, builds the report through `lib/screenreader-report.mjs`, writes it to
 * `test-results/screenreader/summary.md` and appends it to the GitHub job summary when
 * `GITHUB_STEP_SUMMARY` is set. With `--check-run` it also posts the check run through the Checks API
 * (`lib/github-check-run.mjs`), behind the fork guard in `.github/workflows/screenreader.yml`, with
 * `continue-on-error`: the check run reports, it never decides the job. `--dry-run` prints the
 * payload instead of posting and needs no token.
 *
 * Environment for the post: `GITHUB_TOKEN` (with `checks: write`), `GITHUB_REPOSITORY`,
 * `SCREENREADER_HEAD_SHA` (the pull request's head on a pull request, `github.sha` otherwise), and
 * optionally `SCREENREADER_REPORT_URL`, `GITHUB_API_URL`, `GITHUB_SERVER_URL` and `GITHUB_RUN_ID`.
 * `SCREENREADER_PROJECT` names the project when the run left no transcript at all.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postCheckRun } from '../lib/github-check-run.mjs';
import { buildReport, stepLines } from '../lib/screenreader-report.mjs';
import { SCENARIO_FILE_SUFFIX } from '../lib/screenreader-scenario.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(TESTS_ROOT, 'test-results/screenreader');
const TRANSCRIPTS_DIR = path.join(OUTPUT_DIR, 'transcripts');
const SCENARIOS_DIR = path.join(TESTS_ROOT, 'screenreader/scenarios');
const env = process.env;
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const postRun = args.has('--check-run');
const runUrl = env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
  ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
  : undefined;
const problems = [];
const transcripts = [];

if (existsSync(TRANSCRIPTS_DIR)) {
  readdirSync(TRANSCRIPTS_DIR).filter(name => name.endsWith('.json')).sort().forEach((name) => {
    try {
      transcripts.push(JSON.parse(readFileSync(path.join(TRANSCRIPTS_DIR, name), 'utf8')));
    } catch (error) {
      problems.push(`transcript ${name} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

const scenarioFiles = readdirSync(SCENARIOS_DIR).filter(name => name.endsWith(SCENARIO_FILE_SUFFIX)).sort();
const lines = new Map(scenarioFiles.map(name => [
  name.slice(0, -SCENARIO_FILE_SUFFIX.length),
  stepLines(readFileSync(path.join(SCENARIOS_DIR, name), 'utf8')),
]));
const report = buildReport({
  transcripts,
  expectedScenarios: [...lines.keys()],
  project: env.SCREENREADER_PROJECT || undefined,
  problems,
  reportUrl: env.SCREENREADER_REPORT_URL || undefined,
  runUrl,
  lines,
});
const summary = `## ${report.title}\n\n${report.summary}`;

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(path.join(OUTPUT_DIR, 'summary.md'), `${summary}\n`);

if (env.GITHUB_STEP_SUMMARY) {
  appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

process.stdout.write(`screenreader-report: ${report.name} (${report.conclusion}): ${report.headline}\n`);

if (dryRun) {
  process.stdout.write(`${JSON.stringify({ ...report, summary: undefined }, null, 2)}\n`);
  process.exit(0);
}

if (!postRun) {
  process.exit(0);
}

for (const name of ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'SCREENREADER_HEAD_SHA']) {
  if (!env[name]) {
    process.stderr.write(`screenreader-report: ${name} is not set, so no check run was posted.\n`);
    process.exit(1);
  }
}

const created = await postCheckRun({
  token: env.GITHUB_TOKEN,
  repository: env.GITHUB_REPOSITORY,
  headSha: env.SCREENREADER_HEAD_SHA,
  payload: report,
  detailsUrl: env.SCREENREADER_REPORT_URL || runUrl,
  apiUrl: env.GITHUB_API_URL,
});

process.stdout.write(`screenreader-report: posted "${report.name}" (${report.conclusion})\n${created.html_url}\n`);

if (env.GITHUB_OUTPUT) {
  appendFileSync(env.GITHUB_OUTPUT, `check-url=${created.html_url}\n`);
}
