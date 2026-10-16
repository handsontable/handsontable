import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';

// tests/AGENTS.md ("Declaring the legs"): a pull request runs each Playwright spec on the legs it
// declares, and three paths run the full matrix regardless: the nightly (`E2E nightly`), the rc/stable
// publish path, and a master push. The switch is one environment variable the config reads
// (`HOT_E2E_FULL_MATRIX`, tests/lib/leg-declarations.mjs), set by e2e.yml from its `full-matrix`
// input. Every link fails silently when it breaks: an input nobody forwards leaves the nightly
// running the pull-request shape and calling it a full matrix; an `env:` on the wrong step sets the
// variable where nothing reads it; a `--pass-with-no-tests` turns an empty leg from a red job into a
// green one that tested nothing; a nightly the ledger does not chain on records none of its flakes.
// This pins the chain.
//
// Text-based, like playwright-engines.test.mjs: no YAML parser is a dependency of the repo root.

const ROOT = repoRoot();
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
// Whole-line comments go entirely (so a block of them between two keys does not break a multi-line
// pin), a trailing comment loses its text. TS and JS comments are dropped too, so a docblock that
// NAMES a banned flag does not trip the ban.
const stripYamlComments = source => source.replace(/^[ \t]*#.*\n/gm, '').replace(/(^|\s)#.*$/gm, '$1');
const stripTsComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const DOC = 'See tests/AGENTS.md, "Declaring the legs".';

const E2E = '.github/workflows/e2e.yml';
const TESTS = '.github/workflows/test.yml';
const DEVELOP = '.github/workflows/develop.yml';
const PUBLISH = '.github/workflows/publish.yml';
const NIGHTLY = '.github/workflows/e2e-nightly.yml';
const VISUAL_NIGHTLY = '.github/workflows/visual-nightly.yml';
const TEST_HEALTH = '.github/workflows/test-health.yml';
const NIGHTLY_NAME = 'E2E nightly';
const FULL_MATRIX_ENV_LINE = /^ {10}HOT_E2E_FULL_MATRIX: \$\{\{ inputs\.full-matrix && '1' \|\| '' \}\}$/m;
const RUN_LINE = /^ {8}run: cd tests && npx playwright test --project=e2e-\$\{\{ matrix\.theme \}\}\$\{\{ matrix\.bundle\.suffix \}\}$/m;

test('e2e.yml takes a full-matrix input, off by default, declared before run-playwright', () => {
  const workflow = stripYamlComments(read(E2E));
  const inputs = workflow.match(/^on:\n {2}workflow_call:\n {4}inputs:\n([\s\S]*?)\n\njobs:/m)?.[1];

  assert.ok(inputs, `${E2E} must declare its workflow_call inputs. ${DOC}`);
  assert.match(inputs, /^ {6}full-matrix:\n(?: {8}description: .*\n)? {8}type: boolean\n {8}default: false$/m,
    `${E2E} must take a boolean full-matrix input defaulting to false: a pull request runs the declared shape. ${DOC}`);
  assert.ok(inputs.indexOf('full-matrix:') < inputs.indexOf('run-playwright:'),
    `${E2E} declares full-matrix before run-playwright, so a later input appended after run-playwright does not collide. ${DOC}`);
});

test('e2e.yml sets HOT_E2E_FULL_MATRIX from the input on the six-leg run step only, above an unchanged run line', () => {
  const workflow = stripYamlComments(read(E2E));
  const playwright = job(workflow, 'playwright');
  const engines = job(workflow, 'playwright-engines');

  assert.ok(playwright && engines, `${E2E} must keep the playwright and playwright-engines jobs. ${DOC}`);

  const runStep = steps(playwright).find(step => /^- name: Run Playwright E2E$/m.test(step));

  assert.ok(runStep, `${E2E}'s playwright job must keep the "Run Playwright E2E" step. ${DOC}`);
  assert.match(runStep, /^ {8}env:\n {10}HOT_E2E_FULL_MATRIX: /m,
    `the "Run Playwright E2E" step must carry an env: block with HOT_E2E_FULL_MATRIX; the config reads it. ${DOC}`);
  assert.match(runStep, FULL_MATRIX_ENV_LINE,
    `HOT_E2E_FULL_MATRIX must be exactly \${{ inputs.full-matrix && '1' || '' }}: the config accepts "1" and "" `
    + `and throws on anything else, so a "true" here would red every leg. ${DOC}`);
  assert.match(runStep, RUN_LINE, `the run line of "Run Playwright E2E" must stay as it was: one project per leg. ${DOC}`);
  assert.ok(runStep.indexOf('HOT_E2E_FULL_MATRIX') < runStep.search(RUN_LINE), 'the env: block sits above the run line');

  assert.doesNotMatch(engines, /HOT_E2E_FULL_MATRIX|full-matrix/,
    `the engines job runs every @cross-browser spec on main/umd whatever the leg declarations say; it takes no full-matrix. ${DOC}`);
  assert.equal((workflow.match(/HOT_E2E_FULL_MATRIX:/g) ?? []).length, 1, `${E2E} sets HOT_E2E_FULL_MATRIX in one place`);
});

test('no workflow and no test script passes --pass-with-no-tests: an empty leg must be red', () => {
  const dir = path.join(ROOT, '.github/workflows');

  for (const file of readdirSync(dir).filter(name => name.endsWith('.yml'))) {
    assert.doesNotMatch(readFileSync(path.join(dir, file), 'utf8'), /pass-with-no-tests/,
      `${file} passes --pass-with-no-tests: a project whose grep matches nothing would then be a green job that tested `
      + `nothing instead of a red "No tests found". ${DOC}`);
  }
  for (const file of ['tests/package.json', 'tests/playwright.config.ts', 'tests/playwright-engines.config.ts', 'scripts/pre-push.mjs']) {
    assert.doesNotMatch(stripTsComments(read(file)), /pass-with-no-tests|passWithNoTests/,
      `${file} must not pass --pass-with-no-tests. ${DOC}`);
  }
});

test('test.yml forwards the full matrix on the rc/stable path and a master push, and develop.yml does not', () => {
  const tests = stripYamlComments(read(TESTS));
  const e2e = job(tests, 'e2e');

  assert.match(e2e, /^ {6}full-matrix: \$\{\{ inputs\.test-all \|\| github\.ref_name == 'master' \}\}$/m,
    `${TESTS}'s e2e job must forward full-matrix as \${{ inputs.test-all || github.ref_name == 'master' }}: publish.yml `
    + `calls this workflow with test-all: true on the rc/stable path, and the master push has no nightly of its own. ${DOC}`);

  const develop = stripYamlComments(read(DEVELOP));

  assert.doesNotMatch(job(develop, 'e2e'), /full-matrix/,
    `${DEVELOP} keeps the pull-request shape on the develop push: the durations and the budget measure it, and the `
    + `nightly covers the matrix. ${DOC}`);

  const publish = stripYamlComments(read(PUBLISH));
  const calls = [...publish.matchAll(/uses: \.\/\.github\/workflows\/test\.yml\n {4}with:\n((?: {6}.*\n)+)/g)];

  assert.ok(calls.length >= 2, `${PUBLISH} must still call test.yml on both the rc and the stable path`);
  calls.forEach(([, withBlock]) => assert.match(withBlock, /^ {6}test-all: true$/m,
    `${PUBLISH}'s test.yml calls must pass test-all: true, which is what turns the full matrix on there. ${DOC}`));
});

test('the E2E nightly runs the full matrix on develop every weeknight, validates itself on pull requests, and pings Slack on develop only', () => {
  const nightly = read(NIGHTLY);
  const clean = stripYamlComments(nightly);
  const visual = stripYamlComments(read(VISUAL_NIGHTLY));

  assert.match(clean, new RegExp(`^name: ${NIGHTLY_NAME}$`, 'm'), `${NIGHTLY} is named "${NIGHTLY_NAME}", the name test-health.yml chains on. ${DOC}`);

  const cron = clean.match(/^ {4}- cron: '([^']+)'$/m)?.[1];

  assert.equal(cron, '30 3 * * 2-6', `${NIGHTLY} runs at 03:30 UTC on Tuesday to Saturday: the night after each weekday's merges, clear of every other scheduled workflow. ${DOC}`);
  assert.notEqual(cron, visual.match(/^ {4}- cron: '([^']+)'$/m)?.[1], 'the two nightlies take different slots');
  assert.match(clean, /^ {2}workflow_dispatch:$/m, `${NIGHTLY} can be dispatched (from any ref: a dispatch from a branch is the cheapest full-matrix proof run). ${DOC}`);
  assert.match(clean, /^ {2}pull_request:\n {4}paths: \[ '\.github\/workflows\/e2e-nightly\.yml' \]$/m,
    `${NIGHTLY} validates its own graph on a pull request that touches it, as visual-nightly.yml does. ${DOC}`);
  assert.doesNotMatch(clean, /^permissions:/m, `${NIGHTLY} carries no top-level permissions block (parity with visual-nightly.yml and develop.yml). ${DOC}`);
  assert.match(clean, /^concurrency:\n {2}group: e2e-nightly-\$\{\{ github\.ref \}\}\n {2}cancel-in-progress: false$/m,
    `${NIGHTLY} queues a dispatch behind the scheduled run instead of cancelling it. ${DOC}`);

  assert.deepEqual(jobIds(clean), ['build', 'e2e', 'notify'], `${NIGHTLY} has the three jobs build, e2e and notify`);

  const build = job(clean, 'build');
  const e2e = job(clean, 'e2e');
  const notify = job(clean, 'notify');

  for (const [name, body] of [['build', build], ['e2e', e2e]]) {
    assert.match(body, /^ {4}if: github\.event_name != 'pull_request'$/m,
      `${NIGHTLY}'s ${name} job skips itself on the self-validation pull request, so a temporary run-on-PR edit cannot merge. ${DOC}`);
  }
  assert.match(build, /uses: \.\/\.github\/workflows\/build\.yml/);
  assert.match(build, /^ {6}run-umd: true$/m, 'the nightly builds the UMD bundles the legs load');
  assert.match(e2e, /uses: \.\/\.github\/workflows\/e2e\.yml/);
  assert.match(e2e, /^ {6}run-playwright: true$/m);
  assert.match(e2e, /^ {6}full-matrix: true$/m, `the nightly's e2e job turns the full matrix on. ${DOC}`);
  assert.doesNotMatch(e2e, /run-all/, 'no run-all: the Puppeteer legs stay off here (the frozen suite has its own plan)');
  assert.match(e2e, /^ {4}needs: \[ build \]$/m);

  assert.match(notify, /^ {4}if: \$\{\{ failure\(\) && github\.event_name != 'pull_request' && github\.ref_name == 'develop' \}\}$/m,
    `${NIGHTLY}'s notify job fires on failure() (the implicit success() would make it unreachable), never on the self-validation `
    + `pull request, and only on develop: a dispatch from a branch is a proof run, not an alert. ${DOC}`);
  assert.match(notify, /^ {6}SLACK_WEBHOOK_URL: \$\{\{ secrets\.SLACK_VISUAL_WEBHOOK_URL \}\}$/m,
    'the nightly posts to the channel that triages the visual nightly, through the same webhook');
  assert.match(notify, /^ {8}if: env\.SLACK_WEBHOOK_URL != ''$/m, 'an absent secret skips the step, so the hook stays optional');

  const slackAction = visual.match(/uses: (slackapi\/slack-github-action@[0-9a-f]{40})/)?.[1];

  assert.ok(slackAction, `${VISUAL_NIGHTLY} pins slackapi/slack-github-action by SHA`);
  assert.ok(notify.includes(`uses: ${slackAction}`), `${NIGHTLY} uses the same pinned Slack action as ${VISUAL_NIGHTLY}`);
  assert.match(notify, /it runs on an axis it did not declare/, 'the message says what a nightly-only red means');
});

test('test-health.yml chains on the E2E nightly, by the name the workflow carries', () => {
  const health = read(TEST_HEALTH);

  assert.match(health, /workflows: \['Tests', 'Develop', 'Publish', 'Visual nightly', 'E2E nightly'\]/,
    `${TEST_HEALTH} must collect the E2E nightly's flaky and failed tests: a nightly-only red is the signal a spec runs on an `
    + `axis it did not declare, and the ledger is where it is triaged. ${DOC}`);
  assert.ok(health.includes(`'${NIGHTLY_NAME}'`));
  assert.match(read(NIGHTLY), new RegExp(`^name: ${NIGHTLY_NAME}$`, 'm'));
});
