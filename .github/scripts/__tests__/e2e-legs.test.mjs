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
// The frozen Jasmine suite has the same shape with one switch fewer: a pull request and a develop
// push run it on ONE leg, `UMD (theme: main)`, and the six legs (three themes × UMD / UMD.min) run
// only where `e2e.yml`'s `jasmine-full-matrix` input is set – the same three paths as the Playwright
// full matrix, through the same forwarding. The matrix axes are `fromJSON` ternaries over two JSON
// literals each, so the single-leg literal and the six-leg literal are pinned by value below, and
// the six-leg shape is held equal to the Playwright matrix (the parity the two jobs used to have on
// every run now holds on the full-matrix runs). The record the ledger's `jasmine` tier reads keeps
// its artifact name on either shape.
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
const JASMINE_INPUT = 'jasmine-full-matrix';
const MAIN_LEG = 'UMD (theme: main)';
const FORWARDED = /^ {6}jasmine-full-matrix: \$\{\{ inputs\.test-all \|\| github\.ref_name == 'master' \}\}$/m;
const JASMINE_DOC = 'See .ai/CI.md (the Jasmine single-leg entry) and handsontable/.ai/TESTING.md, "The Jasmine suite is frozen".';
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

/**
 * The two JSON literals of one `fromJSON(inputs.jasmine-full-matrix && '<six>' || '<one>')` matrix axis.
 *
 * @param {string} puppeteer The puppeteer job's text.
 * @param {string} axis The axis key (`theme` or `bundle`).
 * @returns {{six: unknown[], one: unknown[]}} Both literals, parsed.
 */
function jasmineAxis(puppeteer, axis) {
  const line = puppeteer.match(new RegExp(`^ {8}${axis}: (.*)$`, 'm'))?.[1];

  assert.ok(line, `${E2E}'s puppeteer matrix must declare a ${axis} axis. ${JASMINE_DOC}`);

  const parts = line.match(/^\$\{\{ fromJSON\(inputs\.jasmine-full-matrix && '([^']+)' \|\| '([^']+)'\) \}\}$/);

  assert.ok(parts, `the ${axis} axis must be exactly \${{ fromJSON(inputs.${JASMINE_INPUT} && '<six-leg JSON>' || '<one-leg JSON>') }}: `
    + `\`&&\`/\`||\` return their operands, so the input picks the literal and fromJSON turns it into the axis. ${JASMINE_DOC}`);

  return { six: JSON.parse(parts[1]), one: JSON.parse(parts[2]) };
}

test(`e2e.yml takes a ${JASMINE_INPUT} input, off by default, declared right after full-matrix`, () => {
  const workflow = stripYamlComments(read(E2E));
  const inputs = workflow.match(/^on:\n {2}workflow_call:\n {4}inputs:\n([\s\S]*?)\n\njobs:/m)?.[1];

  assert.ok(inputs, `${E2E} must declare its workflow_call inputs. ${JASMINE_DOC}`);
  assert.match(inputs, /^ {6}jasmine-full-matrix:\n(?: {8}description: .*\n)? {8}type: boolean\n {8}default: false$/m,
    `${E2E} must take a boolean ${JASMINE_INPUT} input defaulting to false: a pull request and a develop push run one Jasmine leg. ${JASMINE_DOC}`);

  const order = ['full-matrix:', 'jasmine-full-matrix:', 'run-playwright:'].map(key => inputs.search(new RegExp(`^ {6}${key}$`, 'm')));

  assert.ok(order.every(index => index >= 0) && order[0] < order[1] && order[1] < order[2],
    `${E2E} declares ${JASMINE_INPUT} between full-matrix and run-playwright: the two matrix switches sit together, and nothing appended after run-playwright collides. ${JASMINE_DOC}`);
});

test(`e2e.yml's puppeteer job runs one Jasmine leg, ${MAIN_LEG}, unless ${JASMINE_INPUT} asks for the six`, () => {
  const workflow = stripYamlComments(read(E2E));
  const puppeteer = job(workflow, 'puppeteer');

  assert.ok(puppeteer, `${E2E} must keep the puppeteer job. ${JASMINE_DOC}`);
  assert.match(puppeteer, /^ {4}if: \$\{\{ inputs\.run-all \|\| inputs\.run-e2e \|\| inputs\.run-e2e-min \}\}$/m,
    `the puppeteer job keeps its scope gate: the e2e and e2e-min scopes decide whether the single leg runs at all. ${JASMINE_DOC}`);
  assert.match(puppeteer, /^ {6}fail-fast: false$/m, 'a red leg of the six never cancels the others');

  const theme = jasmineAxis(puppeteer, 'theme');
  const bundle = jasmineAxis(puppeteer, 'bundle');

  assert.deepEqual(theme.one, ['main'], `the pull-request shape is the main theme alone. ${JASMINE_DOC}`);
  assert.deepEqual(bundle.one, [{ label: 'UMD', dump: 'test:e2e.dump' }],
    `the pull-request shape is the plain UMD bundle alone, through test:e2e.dump; test:production (the minified bundle) runs in the full matrix only. ${JASMINE_DOC}`);
  assert.deepEqual(theme.six, ['main', 'horizon', 'classic'], `the full matrix runs the three themes. ${JASMINE_DOC}`);
  assert.deepEqual(bundle.six, [{ label: 'UMD', dump: 'test:e2e.dump' }, { label: 'UMD.min', dump: 'test:production.dump' }],
    `the full matrix runs both bundles, the minified one through test:production.dump. ${JASMINE_DOC}`);
  assert.equal(`${bundle.one[0].label} (theme: ${theme.one[0]})`, MAIN_LEG,
    `the single leg is the one the ledger names ${MAIN_LEG} (HOT_E2E_LEG + the runner's theme)`);

  const test = steps(puppeteer).find(step => /^- name: Test$/m.test(step));
  const upload = steps(puppeteer).find(step => /^- name: Upload the failed-specs record$/m.test(step));

  assert.ok(test && upload, 'the puppeteer job keeps its Test and Upload the failed-specs record steps');
  assert.match(test, /^ {10}HOT_E2E_LEG: \$\{\{ matrix\.bundle\.label \}\}$/m,
    `HOT_E2E_LEG stays the bundle label: the runner appends the theme, and the ledger's leg field reads "${MAIN_LEG}" on either shape. ${JASMINE_DOC}`);
  assert.match(test, /npm run \$\{\{ matrix\.bundle\.dump \}\} --theme=\$\{\{ matrix\.theme \}\} && npm run test:e2e\.puppeteer --theme=\$\{\{ matrix\.theme \}\}/,
    'the Test step reads the dump script and the theme from the matrix, on either shape');
  assert.match(upload, /^ {8}if: failure\(\)$/m, 'the record uploads on failure() only: a green leg has no record');
  assert.match(upload, /^ {10}name: puppeteer-failed-specs-\$\{\{ matrix\.bundle\.label \}\}-\$\{\{ matrix\.theme \}\}$/m,
    `the record's artifact name is unchanged, so the ledger's jasmine tier sees the one leg and the six alike (test-health.test.mjs pins the prefix). ${JASMINE_DOC}`);
  assert.doesNotMatch(puppeteer, /full-matrix: |HOT_E2E_FULL_MATRIX/,
    'the Playwright full-matrix switch never reaches the puppeteer job; the Jasmine suite has its own input');
});

test('on the full-matrix runs the Jasmine matrix keeps the Playwright matrix\'s shape (parity, re-scoped from every run to the nightly)', () => {
  const workflow = stripYamlComments(read(E2E));
  const puppeteer = job(workflow, 'puppeteer');
  const playwright = job(workflow, 'playwright');
  const playwrightThemes = playwright.match(/^ {8}theme: \[([^\]]+)\]$/m)?.[1].split(',').map(theme => theme.trim());
  const playwrightLabels = [...playwright.matchAll(/^ {10}- \{ label: '([^']+)', suffix: '[^']*' \}$/gm)].map(([, label]) => label);

  assert.ok(playwrightThemes?.length && playwrightLabels.length, `${E2E}'s playwright job must keep its theme and bundle axes readable (playwright-durations.test.mjs reads them the same way)`);
  assert.deepEqual(jasmineAxis(puppeteer, 'theme').six, playwrightThemes,
    `the six Jasmine legs run the themes the Playwright legs run: the two tiers used to share one matrix on every run, and they still do on the E2E nightly, the rc/stable path and a master push. ${JASMINE_DOC}`);
  assert.deepEqual(jasmineAxis(puppeteer, 'bundle').six.map(entry => entry.label), playwrightLabels,
    `the six Jasmine legs run the bundles the Playwright legs run, under the same labels (the job names and the ledger's legs line up). ${JASMINE_DOC}`);
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
  assert.match(e2e, FORWARDED,
    `${TESTS}'s e2e job must forward ${JASMINE_INPUT} the same way: the six Jasmine legs run where the Playwright full matrix `
    + `runs, and a pull request runs ${MAIN_LEG} alone. ${JASMINE_DOC}`);

  const develop = stripYamlComments(read(DEVELOP));

  assert.doesNotMatch(job(develop, 'e2e'), /full-matrix/,
    `${DEVELOP} keeps the pull-request shape on the develop push: the durations and the budget measure it, and the `
    + `nightly covers the matrix – for the Jasmine suite too (no ${JASMINE_INPUT} here: the develop push runs ${MAIN_LEG} alone). ${DOC}`);

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
  for (const input of ['run-e2e', 'run-e2e-min', JASMINE_INPUT]) {
    assert.match(e2e, new RegExp(`^ {6}${input}: true$`, 'm'),
      `the nightly's e2e job sets ${input}: true – the six Jasmine legs (both scopes, the full matrix) run here and on no pull request. ${JASMINE_DOC}`);
  }
  assert.doesNotMatch(e2e, /run-all/, 'no run-all: the inputs name every leg the nightly runs, so a new input defaulting off stays off here until it is listed');
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
  assert.match(notify, /Jasmine/, `the message also says what a nightly-only Jasmine red means: a migration ticket, since pull requests run ${MAIN_LEG} alone. ${JASMINE_DOC}`);
});

test('test-health.yml chains on the E2E nightly, by the name the workflow carries', () => {
  const health = read(TEST_HEALTH);

  assert.match(health, /workflows: \['Tests', 'Develop', 'Publish', 'Visual nightly', 'E2E nightly'\]/,
    `${TEST_HEALTH} must collect the E2E nightly's flaky and failed tests: a nightly-only red is the signal a spec runs on an `
    + `axis it did not declare, and the ledger is where it is triaged. ${DOC}`);
  assert.ok(health.includes(`'${NIGHTLY_NAME}'`));
  assert.match(read(NIGHTLY), new RegExp(`^name: ${NIGHTLY_NAME}$`, 'm'));
});
