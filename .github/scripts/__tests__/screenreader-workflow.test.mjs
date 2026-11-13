import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';
import { SCENARIO_GROUPS, SCREENREADER_PROJECTS } from '../../../tests/lib/screenreader-matrix.mjs';
import { loadScenarios, scenarioBudgetMs } from '../../../tests/lib/screenreader-scenario.mjs';

// tests/AGENTS.md ("Screen readers: the NVDA and VoiceOver lanes"): the screen reader lanes are report-only and run on
// their own nightly, never in the pull-request Tests pipeline. Every link in that chain fails silently
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
const DOC = 'See tests/AGENTS.md, "Screen readers: the NVDA and VoiceOver lanes".';

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

test('screenreader.yml is an NVDA job on Windows and a VoiceOver job on macOS, never a second project in one job', () => {
  const workflow = stripYamlComments(read(LANE));

  assert.deepEqual(jobIds(workflow), ['nvda', 'voiceover'],
    `${LANE} runs one job per screen reader: Guidepup drives one screen reader per machine. ${DOC}`);
});

test('a subset dispatch runs the named projects only: each lane job skips itself when none of its projects is named, and the matrix drops the others', () => {
  const workflow = stripYamlComments(read(LANE));
  const [header] = workflow.split(/^jobs:$/m);
  const input = name => header.split(/^ {6}(?=[A-Za-z0-9_-]+:$)/m).find(block => block.startsWith(`${name}:`)) ?? '';

  ['groups', 'projects'].forEach((name) => {
    assert.match(input(name), /^ {8}type: string$/m, `${LANE}: ${name} is a comma-separated subset. ${DOC}`);
    assert.match(input(name), /^ {8}default: ''$/m, `${LANE}: an empty ${name} runs every one, so a caller that passes nothing runs the full set. ${DOC}`);
  });

  // `contains(format(',{0},', inputs.projects), ',<project>,')`: a whole-name match inside the comma-separated
  // list, so `vo-chromium` never matches a `chromium` and an empty list matches nothing.
  const named = project => `contains\\(format\\(',\\{0\\},', inputs\\.projects\\), ',${project},'\\)`;

  [['nvda', 'nvda-chromium', 'nvda-firefox'], ['voiceover', 'vo-webkit', 'vo-chromium']].forEach(([id, ...projects]) => {
    const body = job(workflow, id);

    assert.match(body, new RegExp(`^ {4}if: \\$\\{\\{ inputs\\.projects == '' \\|\\| ${named(projects[0])} \\|\\| ${named(projects[1])} \\}\\}$`, 'm'),
      `${LANE} ${id}: the job runs on an empty projects input, or when it names one of the job's projects; a job-level if reads inputs, never matrix, so the browser filter is the exclude below. ${DOC}`);
    projects.forEach((project) => {
      const browser = project.split('-')[1];

      assert.match(body, new RegExp(`^ {10}- browser: \\$\\{\\{ inputs\\.projects != '' && !${named(project)} && '${browser}' \\|\\| '' \\}\\}$`, 'm'),
        `${LANE} ${id}: a projects input that does not name ${project} excludes its browser from the matrix; an empty input excludes nothing (an exclude of '' matches no combination). Both axes stay literal: the filter is the exclude, never a rewritten axis. ${DOC}`);
    });
    SCENARIO_GROUPS.forEach((group) => {
      assert.match(body, new RegExp(`^ {10}- group: \\$\\{\\{ inputs\\.groups != '' && !contains\\(format\\(',\\{0\\},', inputs\\.groups\\), ',${group},'\\) && '${group}' \\|\\| '' \\}\\}$`, 'm'),
        `${LANE} ${id}: a groups input that does not name ${group} excludes it from the matrix, one entry per group of SCENARIO_GROUPS (tests/lib/screenreader-matrix.mjs); an empty input excludes nothing. A new group adds its line here. ${DOC}`);
    });
    assert.equal((body.match(/^ {10}- group: /gm) ?? []).length, SCENARIO_GROUPS.length,
      `${LANE} ${id}: one group exclude per group of SCENARIO_GROUPS, none for a group the list no longer has. ${DOC}`);
  });
});

test('the NVDA job: Windows, one browser per job, report-only, running the screen reader config against the UMD artifact', () => {
  const workflow = stripYamlComments(read(LANE));

  const nvda = job(workflow, 'nvda');
  const stepsOf = steps(nvda);
  const step = name => stepsOf.find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';
  const checkout = stepsOf.find(entry => /^- uses: actions\/checkout@/m.test(entry)) ?? '';

  assert.match(nvda, /^ {4}runs-on: windows-2025$/m, `${LANE}: NVDA runs on the pinned Windows image Guidepup's own suite is green on. ${DOC}`);
  assert.match(nvda, /^ {4}continue-on-error: true$/m, `${LANE}: the lane is report-only; a red job must never fail the nightly. ${DOC}`);
  assert.match(nvda, /^ {8}browser: \[ chromium, firefox \]$/m, `${LANE}: one browser per job, the two NVDA browsers. ${DOC}`);
  assert.match(nvda, new RegExp(`^ {8}group: \\[ ${SCENARIO_GROUPS.join(', ')} \\]$`, 'm'),
    `${LANE}: one job per scenario group, every group of SCENARIO_GROUPS (tests/lib/screenreader-scenario.mjs), so no scenario is left out of the nightly. ${DOC}`);
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
  assert.match(step('Run the scenarios'), /^ {10}HOT_SR_GROUP: \$\{\{ matrix\.group \}\}$/m,
    `${LANE}: the job's scenario group reaches the spec as HOT_SR_GROUP, which runs that group's scenarios only. ${DOC}`);
  assert.match(nvda, /^ {6}SCREENREADER_GROUP: \$\{\{ matrix\.group \}\}$/m,
    `${LANE}: the report names the check run after the group and expects that group's transcripts. ${DOC}`);
  assert.match(step('Run the scenarios'), /^ {8}timeout-minutes: 40$/m,
    `${LANE}: the run step times out before the job does: a step timeout is a step failure, so the transcripts, the summary and the check run still come, where the job's timeout would cancel them. ${DOC}`);

  const goldens = step('Upload the recorded goldens');

  assert.match(goldens, /^ {8}if: \$\{\{ !cancelled\(\) && inputs\.update-goldens \}\}$/m,
    `${LANE}: the recorded goldens upload on an update-goldens run only, red or green. ${DOC}`);
  assert.match(goldens, /^ {10}name: screenreader-goldens-nvda-\$\{\{ matrix\.browser \}\}-\$\{\{ matrix\.group \}\}$/m,
    `${LANE}: one goldens artifact per browser and group, the names tests/AGENTS.md tells you to download. ${DOC}`);
  assert.match(goldens, /^ {10}path: tests\/test-results\/screenreader\/goldens$/m,
    `${LANE}: the goldens the job recorded, never the whole tree, whose other groups' files are the checkout's copies and would replace their new recordings when the artifacts are extracted together. ${DOC}`);

  const transcripts = step('Upload the transcripts');

  assert.match(transcripts, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${LANE}: the transcripts upload on a red run too; they are the evidence. ${DOC}`);
  assert.match(transcripts, /^ {10}name: screenreader-transcripts-nvda-\$\{\{ matrix\.browser \}\}-\$\{\{ matrix\.group \}\}$/m,
    `${LANE}: the artifact name stays outside the playwright-report-* glob test-health.yml reads, or a transcript becomes a flake record. ${DOC}`);
  assert.match(transcripts, /^ {10}path: tests\/test-results\/screenreader$/m, `${LANE}: the upload is the config's outputDir. ${DOC}`);
  assert.match(step('Upload the Playwright report'), /^ {10}name: screenreader-playwright-report-nvda-\$\{\{ matrix\.browser \}\}-\$\{\{ matrix\.group \}\}$/m,
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

test('the VoiceOver job: macOS, two browsers at most two at a time, report-only, with the setup recorded and the evidence uploaded', () => {
  const workflow = stripYamlComments(read(LANE));
  const voiceover = job(workflow, 'voiceover');
  const nvda = job(workflow, 'nvda');
  const stepsOf = steps(voiceover);
  const step = name => stepsOf.find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';
  const checkout = stepsOf.find(entry => /^- uses: actions\/checkout@/m.test(entry)) ?? '';
  const guardOf = body => (steps(body).find(entry => /^- name: Post the report check run$/m.test(entry)) ?? '').match(/^ {8}if: (.+)$/m)?.[1];

  assert.match(voiceover, /^ {4}runs-on: macos-26$/m, `${LANE}: VoiceOver runs on the pinned macOS image. ${DOC}`);
  assert.match(voiceover, /^ {4}continue-on-error: true$/m, `${LANE}: the lane is report-only; a red job must never fail the nightly. ${DOC}`);
  assert.match(voiceover, /^ {8}browser: \[ webkit, chromium \]$/m, `${LANE}: one browser per job: Playwright's WebKit and Chromium. ${DOC}`);
  assert.match(voiceover, new RegExp(`^ {8}group: \\[ ${SCENARIO_GROUPS.join(', ')} \\]$`, 'm'),
    `${LANE}: one job per scenario group, every group of SCENARIO_GROUPS, as in the NVDA job. ${DOC}`);
  assert.match(voiceover, /^ {6}SCREENREADER_GROUP: \$\{\{ matrix\.group \}\}$/m);
  assert.match(voiceover, /^ {6}max-parallel: 2$/m, `${LANE}: the organization runs at most five macOS jobs at once; the lane takes two. ${DOC}`);
  assert.match(voiceover, /^ {6}fail-fast: false$/m, `${LANE}: one browser's failure never cancels the other's transcript.`);
  assert.deepEqual(permissions(voiceover), ['contents: read', 'checks: write'],
    `${LANE}: the job's token reads the repository and writes the report check run, nothing else; a grant added here reaches the npx-resolved setup CLI too.`);
  assert.match(checkout, /^ {8}with:\n {10}persist-credentials: false$/m,
    `${LANE}: nothing in the job pushes, so the checkout keeps the token out of .git/config, where the npx -y steps could read it.`);
  assert.match(step('Download the Handsontable UMD build artifact'), /name: handsontable-build-umd/,
    `${LANE}: the lane consumes the UMD build artifact the Build module uploads. ${DOC}`);
  const setupScript = (step('Prepare the environment for screen reader automation').split(/^ {8}run: \|\n/m)[1] ?? '')
    .split('\n').filter(line => /^ {10}\S/.test(line)).map(line => line.trim());

  assert.deepEqual(setupScript.filter(line => !line.startsWith('echo ')), [
    'cd tests',
    'setup() { npx -y @guidepup/setup@0.29.3 setup "$@" --macos-record; }',
    'setup --ci && exit 0',
    'killall ControlCenter || true',
    'sleep 5',
    'setup --ci && exit 0',
    'setup',
  ], `${LANE}: the setup recovers on the same runner. It tries \`setup --ci\`, then once more after relaunching Control Center, whose UI the CLI's Do Not Disturb step drives, then without \`--ci\`, which grants the same automation permissions without Do Not Disturb. Every attempt is recorded, through the pinned CLI run by npx and never installed (its recorder depends on a GPL-licensed ffmpeg build). ${DOC}`);
  assert.equal(setupScript.filter(line => line.startsWith('echo "::warning title=VoiceOver setup::')).length, 2,
    `${LANE}: each fallback says so on the run, and the last one names the missing Do Not Disturb. ${DOC}`);
  assert.match(setupScript.at(-2) ?? '', /Do Not Disturb/, `${LANE}: the warning before the last attempt names what it leaves out.`);
  assert.match(step('Install the browser'), /^ {8}run: cd tests && npx playwright install \$\{\{ matrix\.browser \}\}$/m);
  assert.match(step('Install VoiceOver'), /^ {8}run: cd tests && npx -y @guidepup\/setup@0\.29\.3 install voiceover$/m,
    `${LANE}: VoiceOver's preferences bundle is installed from inside tests/, where @guidepup/guidepup resolves its manifest. ${DOC}`);
  assert.match(step('Run the scenarios'), /^ {8}run: cd tests && npx playwright test --config playwright\.screenreader\.config\.ts --project=vo-\$\{\{ matrix\.browser \}\}$/m,
    `${LANE}: the run step runs the screen reader config on the job's VoiceOver project and nothing else. ${DOC}`);
  assert.match(step('Run the scenarios'), /^ {10}HOT_SR_UPDATE_GOLDENS: \$\{\{ inputs\.update-goldens && '1' \|\| '' \}\}$/m,
    `${LANE}: the update-goldens input reaches the spec as HOT_SR_UPDATE_GOLDENS, '1' or empty. ${DOC}`);
  assert.match(step('Run the scenarios'), /^ {10}HOT_SR_GROUP: \$\{\{ matrix\.group \}\}$/m);
  assert.match(step('Run the scenarios'), /^ {8}timeout-minutes: 40$/m,
    `${LANE}: the run step times out on its own: a step timeout is a step failure, so the transcripts, the recording, the summary and the check run still come. ${DOC}`);

  [
    ['Upload the transcripts', 'screenreader-transcripts-vo-', 'tests\\/test-results\\/screenreader'],
    ['Upload the Playwright report', 'screenreader-playwright-report-vo-', 'tests\\/playwright-report\\/screenreader'],
    ['Upload the setup recording', 'screenreader-recordings-vo-', 'tests\\/recordings'],
  ].forEach(([name, artifact, dir]) => {
    const upload = step(name);

    assert.match(upload, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${LANE}: "${name}" runs on a red run too; it is the evidence. ${DOC}`);
    assert.match(upload, new RegExp(`^ {10}name: ${artifact}\\$\\{\\{ matrix\\.browser \\}\\}-\\$\\{\\{ matrix\\.group \\}\\}$`, 'm'),
      `${LANE}: "${name}" is named per browser and group, and outside the playwright-report-* glob test-health.yml reads. ${DOC}`);
    assert.match(upload, new RegExp(`^ {10}path: ${dir}$`, 'm'), `${LANE}: "${name}" uploads ${dir.replaceAll('\\', '')}.`);
  });

  const goldens = step('Upload the recorded goldens');

  assert.match(goldens, /^ {8}if: \$\{\{ !cancelled\(\) && inputs\.update-goldens \}\}$/m,
    `${LANE}: the recorded goldens upload on an update-goldens run only, red or green. ${DOC}`);
  assert.match(goldens, /^ {10}name: screenreader-goldens-vo-\$\{\{ matrix\.browser \}\}-\$\{\{ matrix\.group \}\}$/m,
    `${LANE}: one goldens artifact per browser and group, the names tests/AGENTS.md tells you to download. ${DOC}`);
  assert.match(goldens, /^ {10}path: tests\/test-results\/screenreader\/goldens$/m,
    `${LANE}: the goldens the job recorded, never the whole tree, whose other groups' files are the checkout's copies and would replace their new recordings when the artifacts are extracted together. ${DOC}`);
  assert.match(step('Write the job summary'), /^ {8}run: node tests\/scripts\/screenreader-report\.mjs$/m);
  assert.match(step('Write the job summary'), /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m);

  const check = step('Post the report check run');

  assert.match(check, /^ {8}continue-on-error: true$/m, `${LANE}: the check run reports, it never decides the job.`);
  assert.match(check, /^ {8}run: node tests\/scripts\/screenreader-report\.mjs --check-run$/m);
  assert.ok(guardOf(voiceover), `${LANE}: the VoiceOver check run carries an if: guard.`);
  assert.equal(guardOf(voiceover), guardOf(nvda),
    `${LANE}: the VoiceOver check run carries the NVDA job's guard, the canonical fork guard fork-guards.test.mjs reads on the first site of the step name. ${DOC}`);
  assert.match(voiceover, /^ {6}SCREENREADER_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}$/m,
    `${LANE}: the check run goes on the head commit, never the merge commit.`);
  assert.match(voiceover, /^ {6}SCREENREADER_PROJECT: vo-\$\{\{ matrix\.browser \}\}$/m,
    `${LANE}: a run that left no transcript is still reported under its project.`);
});

test('every lane job bounds each step that downloads, under a job timeout above the sum of its steps', () => {
  const workflow = stripYamlComments(read(LANE));
  const DOWNLOADING = ['Prepare the environment for screen reader automation', 'Install the browser', /^Install (?:NVDA|VoiceOver)$/];

  ['nvda', 'voiceover'].forEach((id) => {
    const body = job(workflow, id);
    const named = steps(body).map(entry => ({ entry, name: entry.match(/^- name: (.+)$/m)?.[1] ?? '' }));
    const minutes = entry => Number(entry.match(/^ {8}timeout-minutes: (\d+)$/m)?.[1] ?? NaN);

    [...DOWNLOADING, 'Run the scenarios'].forEach((wanted) => {
      const found = named.find(({ name }) => (typeof wanted === 'string' ? name === wanted : wanted.test(name)));

      assert.ok(found, `${LANE} ${id}: a step named ${wanted}`);
      assert.ok(minutes(found.entry) > 0,
        `${LANE} ${id}: "${found.name}" carries its own timeout-minutes. A stalled download or a hung screen reader then fails its step, and the !cancelled() summary, uploads and check run still come; a job timeout would cancel them. ${DOC}`);
    });

    const jobTimeout = Number(body.match(/^ {4}timeout-minutes: (\d+)$/m)?.[1]);
    const stepTimeouts = named.reduce((sum, { entry }) => sum + (minutes(entry) || 0), 0);

    assert.equal(minutes(named.find(({ name }) => name === 'Run the scenarios').entry), 40,
      `${LANE} ${id}: the run step's 40 minutes bound a hung screen reader. ${DOC}`);
    assert.ok(jobTimeout > stepTimeouts,
      `${LANE} ${id}: the job's timeout (${jobTimeout}) is a backstop above its steps' own (${stepTimeouts} in all), so a step times out first and the evidence still uploads. ${DOC}`);
  });
});

test('the run step fits every group\'s scenario budgets plus one retry of its largest, on both lanes', () => {
  // A group's scenarios run one at a time, each within its budget on a slow runner (scenarioBudgetMs()), and
  // the config retries a failed one. A run step shorter than the group's budgets plus one retry of its largest
  // scenario is killed mid-run on a slow night, and the scenarios after that point never run: part of the group
  // drops out, where one scenario out of time would have been one red test.
  const workflow = stripYamlComments(read(LANE));
  const scenarios = loadScenarios(path.join(ROOT, 'tests/screenreader/scenarios')).filter(entry => entry.scenario).map(entry => entry.scenario);

  ['nvda', 'voiceover'].forEach((id) => {
    const run = steps(job(workflow, id)).find(entry => /^- name: Run the scenarios$/m.test(entry)) ?? '';
    const stepMinutes = Number(run.match(/^ {8}timeout-minutes: (\d+)$/m)?.[1]);

    SCENARIO_GROUPS.forEach((group) => {
      const budgets = scenarios.filter(scenario => scenario.group === group).map(scenarioBudgetMs);
      const needed = (budgets.reduce((sum, budget) => sum + budget, 0) + Math.max(0, ...budgets)) / 60_000;

      assert.ok(budgets.length > 0, `${group}: a group with scenarios`);
      assert.ok(needed <= stepMinutes,
        `${LANE} ${id}: the "${group}" group needs ${needed.toFixed(1)} minutes (its ${budgets.length} scenario budgets plus one retry of its largest), more than the run step's ${stepMinutes}. Raise the step and job timeouts, or move scenarios to another group. ${DOC}`);
    });
  });
});

test('screenreader-nightly.yml calls the lane after the UMD build, on a dispatch from any ref and never a cron, and the Tests pipeline never calls it', () => {
  const nightly = stripYamlComments(read(NIGHTLY));

  assert.deepEqual(jobIds(nightly), ['check-inputs', 'build', 'screenreader', 'verdict', 'notify'],
    `${NIGHTLY}: the input guard, build, the lane, the run verdict, the Slack ping. ${DOC}`);
  assert.doesNotMatch(nightly, /^ {2}schedule:$/m,
    `${NIGHTLY}: manual trigger only. The accessibility program runs one audit, fixes, and re-audits; a cron would spend a headed Windows and macOS runner per browser on nights nobody reads. The tiers (axe on a pull request, a semi-lite set on a nightly, the full set on a release candidate and a stable release) come back with the schedule, not before. ${DOC}`);
  assert.doesNotMatch(nightly, /cron/, `${NIGHTLY}: no cron, under any key. ${DOC}`);
  assert.match(nightly, /^ {2}workflow_dispatch:$/m, `${NIGHTLY}: a dispatch from a feature branch is the proof run and the golden recorder.`);
  assert.match(nightly, /^ {2}pull_request:\n {4}paths: \[ '\.github\/workflows\/screenreader-nightly\.yml' \]$/m,
    `${NIGHTLY}: the self-validating trigger stays; without it a broken workflow_call graph first runs after merging. ${DOC}`);
  ['groups', 'projects'].forEach((input) => {
    assert.match(nightly, new RegExp(`^ {6}${input}:\\n(?: {8}.*\\n)*? {8}type: string\\n(?: {8}.*\\n)*? {8}default: ''$`, 'm'),
      `${NIGHTLY}: the ${input} input is a comma-separated subset, and its default, empty, runs every one: a proof run on a branch dispatches the changed group on one project instead of every lane. ${DOC}`);
    assert.match(job(nightly, 'screenreader'), new RegExp(`^ {6}${input}: \\$\\{\\{ inputs\\.${input} \\}\\}$`, 'm'),
      `${NIGHTLY}: the ${input} input is forwarded to the lane as it is; the inputs context is empty on the pull_request trigger, where the job skips itself anyway. ${DOC}`);
  });
  assert.match(job(nightly, 'build'), /^ {6}run-umd: true$/m, `${NIGHTLY}: the lane needs the UMD artifact.`);
  assert.match(job(nightly, 'build'), /^ {4}needs: \[ check-inputs \]$/m,
    `${NIGHTLY}: the build waits for the input guard, so a refused dispatch (a subset on develop, an entry that names nothing) spends no runner and runs no lane. ${DOC}`);

  const guard = job(nightly, 'check-inputs');
  const guardRun = steps(guard).find(entry => /^- name: Refuse a subset on develop and an entry that names nothing$/m.test(entry)) ?? '';

  assert.match(guard, /^ {4}if: github\.event_name != 'pull_request'$/m, `${NIGHTLY}: the guard skips itself on the validation run, like the jobs after it. ${DOC}`);
  assert.match(guard, /^ {4}runs-on: ubuntu-26\.04$/m);
  assert.deepEqual(permissions(guard), ['contents: read'], `${NIGHTLY}: the guard reads the checkout and nothing else. ${DOC}`);
  assert.match(guard, /^ {10}persist-credentials: false$/m);
  assert.match(guard, /^ {10}sparse-checkout: \|\n {12}tests\/lib\n {12}tests\/scripts$/m,
    `${NIGHTLY}: the guard reads the dispatch lists from tests/lib (screenreader-matrix.mjs, dependency-free) and the script from tests/scripts, nothing else. ${DOC}`);
  assert.match(guardRun, /SCREENREADER_PROJECTS: \$\{\{ inputs\.projects \}\}/);
  assert.match(guardRun, /SCREENREADER_GROUPS: \$\{\{ inputs\.groups \}\}/);
  assert.match(guardRun, /^ {8}run: node tests\/scripts\/a11y-dispatch-inputs\.mjs --ref "\$GITHUB_REF" --projects "\$SCREENREADER_PROJECTS" --groups "\$SCREENREADER_GROUPS"$/m,
    `${NIGHTLY}: the guard reads the ref and both subset inputs the way the verdict does (dispatchSubset()): a subset on develop and an entry that is not a whole known name are refused before the build. ${DOC}`);
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
    `${NIGHTLY}: only a dispatch that asks records goldens; a plain dispatch compares. ${DOC}`);
  assert.match(nightly, /^ {2}group: screenreader-nightly-\$\{\{ github\.ref \}\}$/m, `${NIGHTLY}: a static concurrency prefix, never the workflow-name expression.`);
  assert.doesNotMatch(stripYamlComments(read(TESTS)), /screenreader/, `${TESTS}: the lane is report-only and nightly; it is not a pull-request job. ${DOC}`);
});

test('the screen reader nightly ends on a verdict job that expects one check run per lane and group of the matrices', () => {
  const nightly = stripYamlComments(read(NIGHTLY));
  const lane = stripYamlComments(read(LANE));
  const verdict = job(nightly, 'verdict');
  const browsers = id => (/^ {8}browser: \[ ([a-z, ]+) \]$/m.exec(job(lane, id))?.[1] ?? '').split(', ').filter(Boolean);
  const projects = [...browsers('nvda').map(browser => `nvda-${browser}`), ...browsers('voiceover').map(browser => `vo-${browser}`)];
  const expected = [...verdict.matchAll(/--expect "Screen reader \/ ([a-z0-9-]+ [a-z0-9-]+) report"/g)].map(([, name]) => name);
  const lanes = projects.flatMap(project => SCENARIO_GROUPS.map(group => `${project} ${group}`));
  const doc = 'See tests/AGENTS.md, "A11y: the verdict of a check run".';

  assert.equal(projects.length, 4, `${LANE}: two browsers per screen reader.`);
  assert.deepEqual(projects, SCREENREADER_PROJECTS,
    `${LANE}: the matrices' projects are SCREENREADER_PROJECTS of tests/lib/screenreader-matrix.mjs, the list the projects input is checked against before the build and by the verdict. ${doc}`);
  assert.deepEqual(expected.sort(), lanes.sort(), `${NIGHTLY}: the verdict expects exactly the check runs ${LANE} posts, one per project and scenario group of SCENARIO_GROUPS; a job that posted nothing is red. ${doc}`);
  assert.match(verdict, /^ {4}needs: \[ screenreader \]$/m, `${NIGHTLY}: the verdict waits for every lane. ${doc}`);
  assert.match(verdict, /^ {4}if: \$\{\{ !cancelled\(\) && github\.event_name != 'pull_request' \}\}$/m,
    `${NIGHTLY}: !cancelled(), or a red job before it would skip the verdict (the implicit success(), .ai/CI.md). ${doc}`);
  assert.match(verdict, /^ {6}contents: read\n {6}checks: read$/m, `${NIGHTLY}: the verdict only reads check runs. ${doc}`);
  assert.doesNotMatch(verdict, /continue-on-error/, `${NIGHTLY}: the verdict's red is the run's red. ${doc}`);
  assert.match(verdict, /node tests\/scripts\/a11y-run-verdict\.mjs --prefix "Screen reader \/ "\n {10}--ref "\$GITHUB_REF" --projects "\$SCREENREADER_PROJECTS" --groups "\$SCREENREADER_GROUPS"\n/,
    `${NIGHTLY}: on a subset dispatch the verdict keeps the expected lanes the projects and groups inputs name, read with the ref the way check-inputs read them; without this a subset run ends red for the lanes it never ran. ${doc}`);
  assert.match(verdict, /SCREENREADER_PROJECTS: \$\{\{ inputs\.projects \}\}/, `${NIGHTLY}: the same projects input the lane reads. ${doc}`);
  assert.match(verdict, /SCREENREADER_GROUPS: \$\{\{ inputs\.groups \}\}/, `${NIGHTLY}: the same groups input the lane reads. ${doc}`);
  assert.match(verdict, /HEAD_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(job(nightly, 'notify'), /^ {4}needs: \[ screenreader \]$/m, `${NIGHTLY}: Slack never hears of the verdict job's red. ${doc}`);
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
  SCREENREADER_PROJECTS.forEach((project) => {
    assert.match(config, new RegExp(`name: '${project}'`), `${CONFIG}: ${project} of SCREENREADER_PROJECTS (tests/lib/screenreader-matrix.mjs) is a project of the config.`);
  });
  assert.match(config, /name: 'nvda-chromium'/);
  assert.match(config, /name: 'nvda-firefox'/);
  assert.match(config, /name: 'vo-webkit', use: \{ \.\.\.devices\['Desktop Safari'\] \}/,
    `${CONFIG}: vo-webkit is Playwright's WebKit with the Desktop Safari descriptor.`);
  assert.match(config, /name: 'vo-chromium', use: \{ \.\.\.devices\['Desktop Chrome'\] \}/);
  assert.match(config, /if \(process\.platform === 'win32'\) \{\s*return 'nvda';\s*\}/, `${CONFIG}: NVDA is Windows's lane.`);
  assert.match(config, /if \(process\.platform === 'darwin'\) \{\s*return 'voiceover';\s*\}/,
    `${CONFIG}: VoiceOver is macOS's lane, the one the macos-26 job runs. HOT_SR_LANE=dom-echo picks the echo explicitly.`);
});

test('the Guidepup setup CLI is never installed: its optional recording helper depends on a GPL-licensed ffmpeg build', () => {
  const manifest = JSON.parse(read('tests/package.json'));
  const declared = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.optionalDependencies };

  assert.equal(declared['@guidepup/setup'], undefined,
    'tests/package.json: the setup CLI runs through `npx -y @guidepup/setup@<version>` in the workflow, never as a dependency (root AGENTS.md, Dependency management: permissive licenses, transitively).');
  assert.doesNotMatch(read('pnpm-lock.yaml'), /ffmpeg-static|@guidepup\/record|@guidepup\/setup/,
    'pnpm-lock.yaml: nothing may bring the GPL-licensed ffmpeg-static build (through @guidepup/record) into the lockfile.');
});
