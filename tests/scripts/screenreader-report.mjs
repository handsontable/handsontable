/**
 * Writes the screen reader job summary and the evidence document, and posts the
 * `Screen reader / <project> report` check run.
 *
 * Reads every transcript the spec left in `test-results/screenreader/transcripts/` and the scenario
 * files, builds the report through `lib/screenreader-report.mjs`, writes it to
 * `test-results/screenreader/summary.md` and appends it to the GitHub job summary when
 * `GITHUB_STEP_SUMMARY` is set. It writes the evidence document in the shared shape of the accessibility
 * checks (`lib/screenreader-evidence.mjs`) to `test-results/screenreader/evidence/screen-reader.json`,
 * with a detail file per scenario beside it (every step's record), which the transcripts artifact
 * uploads; a document that does not validate is a tooling problem of the report. With `--check-run` it
 * also posts the check run through the Checks API
 * (`lib/github-check-run.mjs`), behind the fork guard in `.github/workflows/screenreader.yml`, with
 * `continue-on-error`: the check run reports, it never decides the job. Its verdict follows the
 * severity rule (`lib/a11y-verdict.mjs`); what counts follows the event (`GITHUB_EVENT_NAME`: a
 * schedule or a dispatch is an audit, anything else a change) and the cluster catalog
 * (`a11y/issues.json`). `--dry-run` prints the payload instead of posting and needs no token.
 *
 * Environment for the post: `GITHUB_TOKEN` (with `checks: write`), `GITHUB_REPOSITORY`,
 * `SCREENREADER_HEAD_SHA` (the pull request's head on a pull request, `github.sha` otherwise), and
 * optionally `SCREENREADER_REPORT_URL`, `GITHUB_API_URL`, `GITHUB_SERVER_URL`, `GITHUB_EVENT_NAME` and
 * `GITHUB_RUN_ID` (stamped on the check run as its `external_id`, which the run verdict reads).
 * `SCREENREADER_PROJECT` names the project when the run left no transcript at all, and `SCREENREADER_GROUP`
 * the scenario group the job ran (the check run's name, the scenarios a transcript is expected for).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeMarkdownText } from '../lib/a11y-baseline.mjs';
import { postCheckRun } from '../lib/github-check-run.mjs';
import { buildScreenreaderEvidence, SCREENREADER_CHECK } from '../lib/screenreader-evidence.mjs';
import { buildReport, stepLines } from '../lib/screenreader-report.mjs';
import { SCENARIO_FILE_SUFFIX, laneOfProject, loadScenarios } from '../lib/screenreader-scenario.mjs';
import { verdictInputs } from '../lib/a11y-verdict-inputs.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(TESTS_ROOT, 'test-results/screenreader');
const TRANSCRIPTS_DIR = path.join(OUTPUT_DIR, 'transcripts');
const EVIDENCE_DIR = path.join(OUTPUT_DIR, 'evidence');
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
const { scope, tracked, externalId, notes } = verdictInputs({ env, testsRoot: TESTS_ROOT });

for (const note of notes) {
  process.stderr.write(`screenreader-report: ${note}\n`);
}

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
// The job ran one scenario group (`SCREENREADER_GROUP`, its matrix entry), or every scenario without it.
const group = env.SCREENREADER_GROUP || undefined;
const scenarios = loadScenarios(SCENARIOS_DIR).filter(entry => entry.scenario && entry.problems.length === 0).map(entry => entry.scenario)
  .filter(scenario => group === undefined || scenario.group === group);
const files = new Map();

// A variant's steps are its base's, so its annotations go on the base's lines.
scenarios.filter(scenario => scenario.variantOf).forEach((scenario) => {
  lines.set(scenario.id, lines.get(scenario.variantOf) ?? new Map());
  files.set(scenario.id, `${scenario.variantOf}${SCENARIO_FILE_SUFFIX}`);
});

const project = env.SCREENREADER_PROJECT || transcripts[0]?.project || 'unknown';
const evidence = buildScreenreaderEvidence({
  project,
  lane: laneOfProject(project),
  group,
  transcripts,
  scenarios,
  run: {
    commit: env.SCREENREADER_HEAD_SHA || env.GITHUB_SHA || null,
    ref: env.GITHUB_REF || null,
    runUrl: runUrl ?? null,
  },
});

mkdirSync(path.join(EVIDENCE_DIR, SCREENREADER_CHECK), { recursive: true });
writeFileSync(path.join(EVIDENCE_DIR, `${SCREENREADER_CHECK}.json`), `${JSON.stringify(evidence.doc, null, 2)}\n`);
evidence.details.forEach(({ file, detail }) => writeFileSync(path.join(EVIDENCE_DIR, file), `${JSON.stringify(detail, null, 2)}\n`));
evidence.problems.forEach(problem => problems.push(`the evidence document does not validate: ${problem}`));

const report = buildReport({
  transcripts,
  expectedScenarios: group === undefined ? [...lines.keys()] : scenarios.map(scenario => scenario.id),
  project: env.SCREENREADER_PROJECT || undefined,
  group,
  problems,
  reportUrl: env.SCREENREADER_REPORT_URL || undefined,
  runUrl,
  lines,
  files,
  scope,
  tracked,
});
// The title is escaped like every value in the summary: a tooling failure's title carries raw error text.
const summary = `## ${escapeMarkdownText(report.title)}\n\n${report.summary}`;

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(path.join(OUTPUT_DIR, 'summary.md'), `${summary}\n`);

// The job summary is written once, by the summary step; the check-run step runs this script a second
// time and must not append it again.
if (env.GITHUB_STEP_SUMMARY && !postRun) {
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
  externalId,
  apiUrl: env.GITHUB_API_URL,
});

process.stdout.write(`screenreader-report: posted "${report.name}" (${report.conclusion})\n${created.html_url}\n`);

if (env.GITHUB_OUTPUT) {
  appendFileSync(env.GITHUB_OUTPUT, `check-url=${created.html_url}\n`);
}
