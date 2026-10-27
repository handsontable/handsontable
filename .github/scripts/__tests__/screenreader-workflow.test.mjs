import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';

// tests/AGENTS.md ("Screen readers: the NVDA lane"): the screen reader lane is report-only and runs on
// its own nightly, never in the pull-request Tests pipeline. Every link in that chain fails silently
// when it breaks: a job that loses `continue-on-error` and starts failing the nightly on a wording
// change, a run step that stops running the screen reader config, a transcript upload renamed into
// the `playwright-report-*` glob the flake ledger reads, or an orchestrator that starts calling the
// module on pull requests. This pins the chain.
//
// Text-based, like the other workflow pins: the tooling job installs no dependencies.

const ROOT = repoRoot();
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const stripYamlComments = source => source.replace(/(^|\s)#.*$/gm, '$1');
const stripTsComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

const LANE = '.github/workflows/screenreader.yml';
const NIGHTLY = '.github/workflows/screenreader-nightly.yml';
const TESTS = '.github/workflows/test.yml';
const CONFIG = 'tests/playwright.screenreader.config.ts';
const DOC = 'See tests/AGENTS.md, "Screen readers: the NVDA lane".';

/**
 * The grants of a job's `permissions` block, one `key: value` per line, in order.
 *
 * @param {string} jobBody One job's text, from `job()`, with the comments stripped.
 * @returns {string[]} The grants, empty when the job has no block.
 */
function permissions(jobBody) {
  const [, after = ''] = jobBody.split(/^ {4}permissions:\n/m);
  const block = after.split('\n');
  const end = block.findIndex(line => line.trim() !== '' && !/^ {6}\S/.test(line));

  return block.slice(0, end === -1 ? block.length : end).map(line => line.trim()).filter(Boolean);
}

test('screenreader.yml is one NVDA job on Windows, one browser per job, report-only, running the screen reader config against the UMD artifact', () => {
  const workflow = stripYamlComments(read(LANE));

  assert.deepEqual(jobIds(workflow), ['nvda'], `${LANE} runs the NVDA lane; the VoiceOver lane joins as a second job. ${DOC}`);

  const nvda = job(workflow, 'nvda');
  const stepsOf = steps(nvda);
  const step = name => stepsOf.find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';
  const checkout = stepsOf.find(entry => /^- uses: actions\/checkout@/m.test(entry)) ?? '';

  assert.match(nvda, /^ {4}runs-on: windows-2025$/m, `${LANE}: NVDA runs on the pinned Windows image Guidepup's own suite is green on. ${DOC}`);
  assert.match(nvda, /^ {4}continue-on-error: true$/m, `${LANE}: the lane is report-only; a red job must never fail the nightly. ${DOC}`);
  assert.match(nvda, /^ {4}timeout-minutes: 30$/m, `${LANE}: a hung screen reader is bounded.`);
  assert.match(nvda, /^ {8}browser: \[ chromium, firefox \]$/m, `${LANE}: one browser per job, the two NVDA browsers. ${DOC}`);
  assert.match(nvda, /^ {6}fail-fast: false$/m, `${LANE}: one browser's failure never cancels the other's transcript.`);
  assert.deepEqual(permissions(nvda), ['contents: read', 'checks: write'],
    `${LANE}: the job's token reads the repository and writes the report check run, nothing else; a grant added here reaches the npx-resolved setup CLI too.`);
  assert.match(checkout, /^ {8}with:\n {10}persist-credentials: false$/m,
    `${LANE}: nothing in the job pushes, so the checkout keeps the token out of .git/config, where the npx -y steps could read it.`);
  assert.match(step('Download the Handsontable UMD build artifact'), /name: handsontable-build-umd/,
    `${LANE}: the lane consumes the UMD build artifact the Build module uploads. ${DOC}`);
  assert.match(step('Install NVDA'), /^ {8}run: cd tests && npx -y @guidepup\/setup@0\.29\.3 install nvda$/m,
    `${LANE}: NVDA is installed from inside tests/, where @guidepup/guidepup resolves its manifest, by the setup CLI at its pinned version through npx: the CLI is never a dependency, because its optional recording helper depends on a GPL-licensed ffmpeg build. ${DOC}`);
  assert.match(step('Prepare the environment for screen reader automation'), /^ {8}run: cd tests && npx -y @guidepup\/setup@0\.29\.3 setup --ci$/m,
    `${LANE}: the environment step runs the same pinned setup CLI through npx. ${DOC}`);
  assert.match(step('Run the scenarios'), /^ {8}run: cd tests && npx playwright test --config playwright\.screenreader\.config\.ts --project=nvda-\$\{\{ matrix\.browser \}\}$/m,
    `${LANE}: the run step runs the screen reader config on the job's browser and nothing else. ${DOC}`);
  assert.match(step('Run the scenarios'), /^ {10}HOT_SR_UPDATE_GOLDENS: \$\{\{ inputs\.update-goldens && '1' \|\| '' \}\}$/m,
    `${LANE}: the update-goldens input reaches the spec as HOT_SR_UPDATE_GOLDENS, '1' or empty: the spec records on '1' only. ${DOC}`);
  assert.match(step('Run the scenarios'), /^ {8}timeout-minutes: 25$/m,
    `${LANE}: the run step times out before the job does: a step timeout is a step failure, so the transcripts, the summary and the check run still come, where the job's 30-minute timeout would cancel them. ${DOC}`);

  const goldens = step('Upload the recorded goldens');

  assert.match(goldens, /^ {8}if: \$\{\{ !cancelled\(\) && inputs\.update-goldens \}\}$/m,
    `${LANE}: the recorded goldens upload on an update-goldens run only, red or green. ${DOC}`);
  assert.match(goldens, /^ {10}name: screenreader-goldens-nvda-\$\{\{ matrix\.browser \}\}$/m,
    `${LANE}: one goldens artifact per browser, the name tests/AGENTS.md tells you to download. ${DOC}`);

  const transcripts = step('Upload the transcripts');

  assert.match(transcripts, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${LANE}: the transcripts upload on a red run too; they are the evidence. ${DOC}`);
  assert.match(transcripts, /^ {10}name: screenreader-transcripts-nvda-\$\{\{ matrix\.browser \}\}$/m,
    `${LANE}: the artifact name stays outside the playwright-report-* glob test-health.yml reads, or a transcript becomes a flake record. ${DOC}`);
  assert.match(transcripts, /^ {10}path: tests\/test-results\/screenreader$/m, `${LANE}: the upload is the config's outputDir. ${DOC}`);
  assert.match(step('Upload the Playwright report'), /^ {10}name: screenreader-playwright-report-nvda-\$\{\{ matrix\.browser \}\}$/m,
    `${LANE}: the Playwright report's artifact name stays outside the playwright-report-* glob too.`);
  assert.match(step('Upload the Playwright report'), /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${LANE}: the Playwright report uploads on a red run too; it holds the traces.`);
  assert.match(step('Write the job summary'), /^ {8}run: node tests\/scripts\/screenreader-report\.mjs$/m, `${LANE}: the summary comes from the report script.`);
  assert.match(step('Write the job summary'), /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${LANE}: the summary is written on a red run too.`);

  const check = step('Post the report check run');

  assert.match(check, /^ {8}continue-on-error: true$/m, `${LANE}: the check run reports, it never decides the job.`);
  assert.match(check, /^ {8}run: node tests\/scripts\/screenreader-report\.mjs --check-run$/m);
  assert.match(nvda, /^ {6}SCREENREADER_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}$/m,
    `${LANE}: the check run goes on the head commit, never the merge commit.`);
});

test('screenreader-nightly.yml calls the lane after the UMD build, on its own cron and from any ref, and the Tests pipeline never calls it', () => {
  const nightly = stripYamlComments(read(NIGHTLY));

  assert.deepEqual(jobIds(nightly), ['build', 'screenreader', 'notify'], `${NIGHTLY}: build, the lane, the Slack ping. ${DOC}`);
  assert.match(nightly, /^ {4}- cron: '30 4 \* \* 2-6'$/m, `${NIGHTLY}: weeknights, after the E2E nightly.`);
  assert.match(nightly, /^ {2}workflow_dispatch:$/m, `${NIGHTLY}: a dispatch from a feature branch is the proof run and the golden recorder.`);
  assert.match(job(nightly, 'build'), /^ {6}run-umd: true$/m, `${NIGHTLY}: the lane needs the UMD artifact.`);
  ['build', 'screenreader'].forEach((id) => {
    assert.match(job(nightly, id), /^ {4}if: github\.event_name != 'pull_request'$/m,
      `${NIGHTLY}: the ${id} job skips itself on the pull_request trigger, which only validates this file; without it a pull request touching the nightly runs the lane on Windows. ${DOC}`);
  });
  assert.match(job(nightly, 'screenreader'), /^ {4}uses: \.\/\.github\/workflows\/screenreader\.yml$/m);
  assert.match(job(nightly, 'screenreader'), /^ {4}needs: \[ build \]$/m);
  assert.doesNotMatch(job(nightly, 'screenreader'), /secrets: inherit/,
    `${NIGHTLY}: the lane gets no inherited secrets; screenreader.yml reads only secrets.GITHUB_TOKEN, which every job has.`);
  assert.match(job(nightly, 'notify'), /^ {4}if: \$\{\{ failure\(\) && github\.event_name != 'pull_request' && github\.ref_name == 'develop' \}\}$/m,
    `${NIGHTLY}: Slack hears of a run that never reached the lane (failure()), on develop only. ${DOC}`);
  assert.match(job(nightly, 'screenreader'), /^ {6}update-goldens: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.update-goldens \|\| false \}\}$/m,
    `${NIGHTLY}: only a dispatch records goldens; the cron always compares. ${DOC}`);
  assert.match(nightly, /^ {2}group: screenreader-nightly-\$\{\{ github\.ref \}\}$/m, `${NIGHTLY}: a static concurrency prefix, never the workflow-name expression.`);
  assert.doesNotMatch(stripYamlComments(read(TESTS)), /screenreader/, `${TESTS}: the lane is report-only and nightly; it is not a pull-request job. ${DOC}`);
});

test('no workflow but the nightly calls the screen reader lane', () => {
  const dir = path.join(ROOT, '.github/workflows');
  const callers = readdirSync(dir)
    .filter(name => /\.ya?ml$/.test(name))
    .filter(name => /^\s*(?:-\s+)?uses:\s*\.\/\.github\/workflows\/screenreader\.ya?ml\s*$/m.test(stripYamlComments(readFileSync(path.join(dir, name), 'utf8'))))
    .sort();

  assert.deepEqual(callers, ['screenreader-nightly.yml'],
    `.github/workflows: only ${NIGHTLY} calls ${LANE}; the lane is report-only and nightly, never part of the pull-request, develop or publish pipelines. ${DOC}`);
});

test('the screen reader config keeps the lane serial, patient and outside the flake ledger', () => {
  const config = stripTsComments(read(CONFIG));

  assert.match(config, /withGuidepup\(config\)/, `${CONFIG}: Guidepup pins one worker, no parallelism and headed browsers.`);
  assert.match(config, /testDir: 'screenreader'/);
  assert.match(config, /outputDir: 'test-results\/screenreader'/, `${CONFIG}: the outputDir the workflow uploads.`);
  assert.match(config, /timeout: 300_000/, `${CONFIG}: a five-minute test timeout, Guidepup's own budget.`);
  assert.match(config, /retries: 2/, `${CONFIG}: two retries, Guidepup's own mitigation.`);
  assert.match(config, /failOnFlakyTests: false/, `${CONFIG}: a scenario that passed on a retry is a transcript like any other.`);
  assert.doesNotMatch(config, /quarantine/, `${CONFIG}: no quarantine reporter in a report-only lane.`);
  assert.doesNotMatch(config, /\['json'/, `${CONFIG}: no JSON reporter, so nothing here can feed the flake ledger.`);
  assert.match(config, /name: 'nvda-chromium'/);
  assert.match(config, /name: 'nvda-firefox'/);
  assert.match(config, /name: 'vo-webkit'/, `${CONFIG}: the VoiceOver projects are named, for the next pull request.`);
  assert.match(config, /name: 'vo-chromium'/);
  assert.match(config, /if \(process\.platform === 'darwin'\) \{\s*throw new Error\(/,
    `${CONFIG}: macOS has no default lane until the VoiceOver runner lands; defaulting to it would start VoiceOver only for the spec to throw. HOT_SR_LANE picks one explicitly.`);
});

test('the Guidepup setup CLI is never installed: its optional recording helper depends on a GPL-licensed ffmpeg build', () => {
  const manifest = JSON.parse(read('tests/package.json'));
  const declared = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.optionalDependencies };

  assert.equal(declared['@guidepup/setup'], undefined,
    'tests/package.json: the setup CLI runs through `npx -y @guidepup/setup@<version>` in the workflow, never as a dependency (root AGENTS.md, Dependency management: permissive licenses, transitively).');
  assert.doesNotMatch(read('pnpm-lock.yaml'), /ffmpeg-static|@guidepup\/record|@guidepup\/setup/,
    'pnpm-lock.yaml: nothing may bring the GPL-licensed ffmpeg-static build (through @guidepup/record) into the lockfile.');
});
