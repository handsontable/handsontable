import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';

// tests/AGENTS.md ("A11y: the axe scan and its baseline"): the axe scan is ONE warn-mode job in the
// Tests pipeline, `A11y / axe`, gated like the Playwright legs on the UMD build it consumes. Every
// link in that chain fails silently when it breaks: an orchestrator that stops calling the module,
// a job that stops running the a11y config or stops uploading its results, a config that stops
// building on the e2e one, or an artifact renamed into the `playwright-report-*` glob the flake
// ledger reads. This pins the chain.
//
// Text-based, like the other workflow pins: the tooling job installs no dependencies.

const ROOT = repoRoot();
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const stripTsComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');
const stripYamlComments = source => source.replace(/(^|\s)#.*$/gm, '$1');

const A11Y = '.github/workflows/a11y.yml';
const E2E = '.github/workflows/e2e.yml';
const TESTS = '.github/workflows/test.yml';
const CONFIG = 'tests/playwright.a11y.config.ts';
const DOC = 'See tests/AGENTS.md, "A11y: the axe scan and its baseline".';

test('a11y.yml runs the axe scan as one job, axe, in the Playwright container, running the a11y config against the UMD artifact', () => {
  const workflow = stripYamlComments(read(A11Y));

  assert.deepEqual(jobIds(workflow), ['axe', 'checks'],
    `${A11Y} runs the axe scan as one job (it does not fan out by theme) and the checks beyond axe as one more. ${DOC}`);

  const axe = job(workflow, 'axe');
  const stepsOf = steps(axe);
  const step = name => stepsOf.find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';

  assert.match(axe, /^ {4}name: axe$/m, `${A11Y}: the job is named axe, so the check reads "A11y / axe". ${DOC}`);
  assert.match(axe, /^ {4}runs-on: ubuntu-26\.04$/m, `${A11Y}: the pinned runner image, like every workflow.`);

  const [, image] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(axe) ?? [];
  const [, e2eImage] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(job(stripYamlComments(read(E2E)), 'playwright')) ?? [];

  assert.ok(image, `${A11Y}: the job runs inside the Playwright container, so the contrast results come from the same Chromium.`);
  assert.equal(image, e2eImage, `${A11Y}: the container tag bumps together with e2e.yml's and the catalog version, never apart.`);
  assert.match(step('Download the Handsontable UMD build artifact'), /name: handsontable-build-umd/,
    `${A11Y}: the scan consumes the UMD build artifact the Build module uploads. ${DOC}`);
  assert.match(step('Run the axe scan'), /^ {8}run: cd tests && npx playwright test --config playwright\.a11y\.config\.ts$/m,
    `${A11Y}: the run step runs the a11y config and nothing else. ${DOC}`);

  const upload = step('Upload the axe results');

  assert.match(upload, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m,
    `${A11Y}: the results upload on a red run too; a warning is only as good as the raw result behind it. ${DOC}`);
  assert.match(upload, /^ {10}name: a11y-axe-results$/m,
    `${A11Y}: the artifact name stays outside the playwright-report-* glob test-health.yml reads, or a scan becomes a flake record. ${DOC}`);
  assert.match(upload, /^ {10}path: tests\/test-results\/a11y$/m, `${A11Y}: the upload is the config's outputDir. ${DOC}`);
  assert.match(upload, /^ {10}retention-days: 3$/m, `${A11Y}: short retention; the artifact is evidence, not a record.`);

  const report = step('Upload the HTML report');

  assert.match(report, /^ {8}id: report$/m, `${A11Y}: the summary link and the check run read the report's URL from this step. ${DOC}`);
  assert.match(report, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${A11Y}: the report uploads on a red run too. ${DOC}`);
  assert.match(report, /^ {10}path: tests\/test-results\/a11y\/a11y-report\.html$/m, `${A11Y}: the report is the reporter's one file. ${DOC}`);
  assert.match(report, /^ {10}archive: false$/m,
    `${A11Y}: the report goes up unzipped, so the browser opens it from the run page instead of downloading a zip. ${DOC}`);
  assert.doesNotMatch(report, /^ {10}name:/m, `${A11Y}: an unzipped artifact is named after its file; a name is ignored. ${DOC}`);
  assert.match(step('Link the HTML report in the job summary'), /REPORT_URL: \$\{\{ steps\.report\.outputs\.artifact-url \}\}/,
    `${A11Y}: the link reaches the shell through env, never interpolated into the script. ${DOC}`);

  const post = step('Post the report check run');

  assert.match(post, /^ {8}run: node tests\/scripts\/a11y-check-run\.mjs$/m, `${A11Y}: the check run is posted by its script. ${DOC}`);
  assert.match(post, /^ {8}continue-on-error: true$/m, `${A11Y}: the check run reports and never decides the job. ${DOC}`);
  assert.match(post, /A11Y_REPORT_URL: \$\{\{ steps\.report\.outputs\.artifact-url \}\}/);
  assert.match(post, /^ {8}id: check$/m, `${A11Y}: the comment links the check run through this step's output. ${DOC}`);

  const comment = step('Post the report comment');

  assert.match(comment, /^ {8}run: node tests\/scripts\/a11y-pr-comment\.mjs$/m, `${A11Y}: the sticky comment is posted by its script. ${DOC}`);
  assert.match(comment, /^ {8}continue-on-error: true$/m, `${A11Y}: the comment reports and never decides the job. ${DOC}`);
  assert.match(comment, /github\.event_name == 'pull_request'/, `${A11Y}: a comment needs a pull request. ${DOC}`);
  assert.match(comment, /A11Y_PR_NUMBER: \$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(comment, /A11Y_CHECKOUT_SHA: \$\{\{ steps\.checkout\.outputs\.commit \}\}/,
    `${A11Y}: the comment reads the base baseline at the checked-out merge commit's first parent, so a baseline that grows does not read as clean `
      + `and a rebuilt merge ref does not list the base's own changes as growth. ${DOC}`);
  assert.match(stepsOf.find(entry => /actions\/checkout@/.test(entry)) ?? '', /^ {8}id: checkout$/m, `${A11Y}: the comment reads the checked-out commit from this step's output. ${DOC}`);
  assert.match(comment, /A11Y_BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/,
    `${A11Y}: the event's base commit is the fallback for a checkout that is not a merge commit. ${DOC}`);
  assert.match(comment, /A11Y_CHECK_URL: \$\{\{ steps\.check\.outputs\.check-url \}\}/);
});

test('the axe job can write its check run on the pull request\'s head commit, and nothing else', () => {
  const axe = job(stripYamlComments(read(A11Y)), 'axe');

  assert.match(axe, /^ {4}permissions:\n {6}contents: read\n {6}checks: write\n {6}pull-requests: write$/m,
    `${A11Y}: job-level permissions: read for the checkout, write for the check run and the sticky comment only. ${DOC}`);
  assert.match(axe, /^ {6}A11Y_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}$/m,
    `${A11Y}: a check run on the merge commit never shows on the pull request; it goes on the head. ${DOC}`);
});

test('test.yml calls the A11y module on the UMD build scope and the CI gate needs it', () => {
  const tests = stripYamlComments(read(TESTS));
  const a11y = job(tests, 'a11y');

  assert.match(a11y, /^ {4}name: A11y$/m, `${TESTS}: the caller job is named A11y, so the check reads "A11y / axe". ${DOC}`);
  assert.match(a11y, /^ {4}needs: \[ checks, build \]$/m, `${TESTS}: the scan needs the build, like the E2E module. ${DOC}`);
  assert.match(a11y, /!failure\(\) && !cancelled\(\)/, `${TESTS}: the job condition carries the status functions every module uses.`);
  assert.match(a11y, /needs\.checks\.outputs\.build-handsontable-umd == 'true'/,
    `${TESTS}: the scan runs when the UMD build runs (core or tests/ changed). ${DOC}`);
  assert.match(a11y, /^ {4}uses: \.\/\.github\/workflows\/a11y\.yml$/m);

  const gate = job(tests, 'ci-gate');

  assert.match(gate, /^ {6}- a11y$/m, `${TESTS}: CI Gate needs a11y, so a tooling red (never a violation) blocks the merge. ${DOC}`);
});

test('the a11y config builds on the e2e config, keeps one project, and leaves the quarantine reporter out', () => {
  const config = stripTsComments(read(CONFIG));

  assert.match(config, /import base from '\.\/playwright\.config';/, `${CONFIG} must build on tests/playwright.config.ts. ${DOC}`);
  assert.match(config, /\.\.\.base,/, `${CONFIG} must spread the base config, so the server and its port are shared. ${DOC}`);
  assert.match(config, /testDir: 'a11y'/, `${CONFIG}: the scan lives in a11y/, outside the leg-declaration sweep. ${DOC}`);
  assert.match(config, /outputDir: 'test-results\/a11y'/, `${CONFIG}: the outputDir is what a11y.yml uploads. ${DOC}`);
  assert.equal((config.match(/^\s+name: '/gm) ?? []).length, 1, `${CONFIG} declares one project. ${DOC}`);
  assert.match(config, /failOnFlakyTests: false/, `${CONFIG}: a scan is a measurement; a retried page load is not a flake to fail on. ${DOC}`);
  assert.match(config, /\['\.\/reporters\/a11y\.ts'\]\s*,?\s*\]/, `${CONFIG}: the a11y reporter is last, so its status is the run's. ${DOC}`);
  assert.doesNotMatch(config, /quarantine/, `${CONFIG}: no quarantine reporter in a scan. ${DOC}`);
  assert.doesNotMatch(config, /pass-with-no-tests|passWithNoTests/, `${CONFIG}: an empty scan must be red.`);
});

test('the a11y spec scans the grid root and the portal with the WCAG 2.2 A and AA tags, and never asserts on a violation', () => {
  const spec = stripTsComments(read('tests/a11y/axe.spec.ts'));

  assert.match(spec, /const WCAG_TAGS = \['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'\];/,
    `the rule set is the level the conformance report claims. ${DOC}`);
  assert.match(spec, /\.include\(root\)\s*\.include\(PORTAL\)/, `the scan includes the root container and the marked portals, nothing else. ${DOC}`);
  assert.doesNotMatch(spec, /expect\([^)]*violations/, `a test never fails on a violation: the reporter applies the mode. ${DOC}`);
});

const CHECKS_DOC = 'See tests/AGENTS.md, "A11y: the checks beyond axe".';
const CHECKS_CONFIG = 'tests/playwright.a11y-checks.config.ts';
const NIGHTLY = '.github/workflows/a11y-nightly.yml';

test('the checks job is report-only: continue-on-error on the job and the run step, a check run per check, never a red pipeline', () => {
  const workflow = stripYamlComments(read(A11Y));
  const checks = job(workflow, 'checks');
  const stepsOf = steps(checks);
  const step = name => stepsOf.find(entry => new RegExp(`^- name: ${name}$`, 'm').test(entry)) ?? '';

  assert.match(checks, /^ {4}name: checks$/m, `${A11Y}: the job is named checks, so the check reads "A11y / checks". ${CHECKS_DOC}`);
  assert.match(checks, /^ {4}continue-on-error: true$/m, `${A11Y}: the checks are report-only; a red one never turns the Tests pipeline red. ${CHECKS_DOC}`);
  assert.match(checks, /^ {4}permissions:\n {6}contents: read\n {6}checks: write$/m,
    `${A11Y}: the checks job reads the checkout and writes its check runs, nothing else. ${CHECKS_DOC}`);
  assert.match(checks, /^ {6}A11Y_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}$/m,
    `${A11Y}: the evidence and its check runs name the pull request's head, never the merge commit. ${CHECKS_DOC}`);
  assert.match(checks, /^ {6}HOT_A11Y_CHECKS_SUITE: \$\{\{ inputs\.nightly && 'nightly' \|\| 'pull-request' \}\}$/m,
    `${A11Y}: a pull request runs the quick checks, the nightly every check. ${CHECKS_DOC}`);

  const [, image] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(checks) ?? [];
  const [, axeImage] = /^ {6}image: (mcr\.microsoft\.com\/playwright:v[\d.]+-noble)$/m.exec(job(workflow, 'axe')) ?? [];

  assert.equal(image, axeImage, `${A11Y}: the checks run in the same Playwright container as the scan. ${CHECKS_DOC}`);

  const run = step('Run the checks beyond axe');

  assert.match(run, /^ {8}continue-on-error: true$/m, `${A11Y}: a tooling red is recorded in the evidence; the step never decides the job. ${CHECKS_DOC}`);
  assert.match(run, /^ {8}run: cd tests && npx playwright test --config playwright\.a11y-checks\.config\.ts$/m, `${A11Y}: the run step runs the checks config. ${CHECKS_DOC}`);

  const upload = step('Upload the evidence');

  assert.match(upload, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${A11Y}: the evidence uploads on a red run too. ${CHECKS_DOC}`);
  assert.match(upload, /^ {10}name: a11y-checks-evidence$/m,
    `${A11Y}: the evidence artifact stays outside the playwright-report-* glob test-health.yml reads. ${CHECKS_DOC}`);
  assert.match(upload, /^ {10}path: tests\/test-results\/a11y-checks$/m, `${A11Y}: the upload is the checks config's outputDir. ${CHECKS_DOC}`);
  assert.match(step('Write the job summary'), /^ {8}run: node tests\/scripts\/a11y-evidence-report\.mjs$/m);

  const post = step('Post the evidence check runs');

  assert.match(post, /^ {8}run: node tests\/scripts\/a11y-evidence-report\.mjs --check-run$/m, `${A11Y}: the check runs are posted by the report script. ${CHECKS_DOC}`);
  assert.match(post, /^ {8}continue-on-error: true$/m, `${A11Y}: the check runs report and never decide the job. ${CHECKS_DOC}`);
  assert.match(post, /A11Y_EVIDENCE_URL: \$\{\{ steps\.evidence\.outputs\.artifact-url \}\}/);
});

test('the checks config builds on the e2e config, takes its projects from the registry, and never fails on a flake', () => {
  const config = stripTsComments(read(CHECKS_CONFIG));

  assert.match(config, /import base from '\.\/playwright\.config';/, `${CHECKS_CONFIG} must build on tests/playwright.config.ts. ${CHECKS_DOC}`);
  assert.match(config, /\.\.\.base,/, `${CHECKS_CONFIG} must spread the base config, so the server and its port are shared. ${CHECKS_DOC}`);
  assert.match(config, /testDir: 'a11y\/checks'/, `${CHECKS_CONFIG}: the checks live in a11y/checks/, outside the leg-declaration sweep. ${CHECKS_DOC}`);
  assert.match(config, /outputDir: 'test-results\/a11y-checks'/, `${CHECKS_CONFIG}: the outputDir is what the checks job uploads. ${CHECKS_DOC}`);
  assert.match(config, /checksForSuite\(process\.env\.HOT_A11Y_CHECKS_SUITE\)/,
    `${CHECKS_CONFIG}: the projects come from EVIDENCE_CHECKS, filtered by the suite. ${CHECKS_DOC}`);
  assert.match(config, /failOnFlakyTests: false/, `${CHECKS_CONFIG}: a flaky check is a finding against the check, recorded, never a red run. ${CHECKS_DOC}`);
  assert.match(config, /\['\.\/reporters\/a11y-checks\.ts'\]\s*,?\s*\]/, `${CHECKS_CONFIG}: the checks reporter writes the documents. ${CHECKS_DOC}`);
  assert.doesNotMatch(config, /quarantine/, `${CHECKS_CONFIG}: no quarantine reporter in a check. ${CHECKS_DOC}`);
  assert.match(stripTsComments(read(CONFIG)), /testMatch: 'axe\.spec\.ts'/,
    `${CONFIG}: the axe config collects its one spec, never the checks in a11y/checks/. ${CHECKS_DOC}`);
});

test('the A11y nightly builds the UMD bundle and calls the module with every check, on a weeknight cron', () => {
  const workflow = stripYamlComments(read(NIGHTLY));

  assert.deepEqual(jobIds(workflow), ['build', 'a11y', 'notify']);
  assert.match(workflow, /^ {4}- cron: '0 5 \* \* 2-6'$/m, `${NIGHTLY}: weeknights at 05:00 UTC, after the screen reader nightly. ${CHECKS_DOC}`);

  const a11y = job(workflow, 'a11y');

  assert.match(a11y, /^ {4}needs: \[ build \]$/m);
  assert.match(a11y, /^ {4}uses: \.\/\.github\/workflows\/a11y\.yml$/m);
  assert.match(a11y, /^ {6}nightly: true$/m, `${NIGHTLY}: the nightly runs every check. ${CHECKS_DOC}`);
  assert.doesNotMatch(a11y, /secrets: inherit/, `${NIGHTLY}: the called workflow reads only GITHUB_TOKEN.`);
  assert.match(job(workflow, 'build'), /^ {6}run-umd: true$/m, `${NIGHTLY}: the checks consume the UMD build artifact.`);
  for (const id of ['build', 'a11y']) {
    assert.match(job(workflow, id), /^ {4}if: github\.event_name != 'pull_request'$/m,
      `${NIGHTLY}: a pull request that touches the file gets a validated run whose jobs skip themselves.`);
  }
});

