import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

/**
 * The proof that the reporter of the checks beyond axe (`reporters/a11y-checks.ts`) turns what a run's
 * tests attached into the evidence document `tests/AGENTS.md` describes ("A11y: the checks beyond
 * axe"), and that the report script posts it as a check run that is never a failure. The merge itself
 * is unit-tested in `lib/__tests__/a11y-evidence.test.mjs`; this is the step around it that only a real
 * run shows: which attempt is read, a failed test recorded as a target that was not measured, a test
 * that passed on a retry flagged, a test that never ran or left an unreadable part recorded the same
 * way, a triage check's part read as triage, a target's detail written to its own file.
 *
 * Each case writes a tiny Playwright project under `test-results/` whose tests attach hand-written
 * evidence parts the way `a11y/evidence.ts` attaches them. No browser runs.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const testsRoot = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');
const reporterPath = path.join(testsRoot, 'reporters/a11y-checks.ts');
const reportScript = path.join(testsRoot, 'scripts/a11y-evidence-report.mjs');
const CHECKS = { 'demo-check': { title: 'Demo check', criteria: ['2.1.2', '2.4.3'] } };

/**
 * The source of one synthetic test that declares its target and attaches a part.
 *
 * @param title The test title.
 * @param page The target's page.
 * @param body Lines to run before the part is attached; `testInfo` is in scope.
 * @param findings The part's findings.
 * @param content What the attached file holds instead of the part (a file that is not JSON).
 * @returns The test's source.
 */
function checkTest(title: string, page: string, body: string[], findings: object[] = [], content?: string): string {
  const target = { page, theme: 'main', state: 'none', url: `/tests/fixtures/demo/${page}.html?theme=main` };
  const part = {
    schema: 1, target, durationMs: 120, findings, detail: { stops: [page] },
    environment: { browser: 'chromium', browserVersion: '1.0', handsontableVersion: '0.0.0', handsontableBuildDate: null },
  };

  return [
    `test(${JSON.stringify(title)}, async({}, testInfo) => {`,
    `  testInfo.annotations.push({ type: 'a11y-target', description: ${JSON.stringify(JSON.stringify(target))} });`,
    ...body.map(line => `  ${line}`),
    '  const file = testInfo.outputPath(\'evidence.json\');',
    `  writeFileSync(file, ${JSON.stringify(content ?? JSON.stringify(part))});`,
    '  await testInfo.attach(\'a11y-evidence\', { path: file, contentType: \'application/json\' });',
    '});',
  ].join('\n');
}

/**
 * Writes and runs one synthetic project named `demo-check`.
 *
 * @param name The case name, also the directory name under `test-results/`.
 * @param specSource The synthetic spec's tests; `test`, `expect` and `writeFileSync` are imported.
 * @param options.maxFailures Stops the run after that many failures, so the tests after it never run.
 * @param options.checks The registry the reporter reads `demo-check` from, when it is not `CHECKS`.
 * @returns The child's exit status and output, and where the reporter wrote.
 */
function runSyntheticCheck(name: string, specSource: string, { maxFailures, checks = CHECKS }: { maxFailures?: number; checks?: object } = {}) {
  // The directory carries the project and worker of the running test, so two workers never share it.
  const info = test.info();
  const dir = path.join(testsRoot, 'test-results', `a11y-checks-reporter-proof-${name}-${info.project.name}-w${info.workerIndex}`);
  const evidenceDir = path.join(dir, 'evidence');

  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'playwright.config.mjs'), [
    'export default {',
    `  testDir: ${JSON.stringify(dir)},`,
    `  outputDir: ${JSON.stringify(path.join(dir, 'output'))},`,
    '  retries: 1,',
    '  workers: 1,',
    ...(maxFailures === undefined ? [] : [`  maxFailures: ${maxFailures},`]),
    `  reporter: [['dot'], [${JSON.stringify(reporterPath)}, ${JSON.stringify({ checks, outputDir: evidenceDir })}]],`,
    '  projects: [{ name: \'demo-check\' }],',
    '};',
    '',
  ].join('\n'));
  writeFileSync(path.join(dir, 'synthetic.spec.mjs'), [
    'import { writeFileSync } from \'node:fs\';',
    'import { test, expect } from \'@playwright/test\';',
    '',
    specSource,
    '',
  ].join('\n'));

  const env = childEnv();
  const child = spawnSync(process.execPath, [playwrightCli, 'test', '-c', path.join(dir, 'playwright.config.mjs')], {
    cwd: testsRoot,
    env: { ...env, CI: '1', FORCE_COLOR: '0', A11Y_HEAD_SHA: 'abc1234' },
    encoding: 'utf8',
    timeout: 90_000,
  });

  return { status: child.status, output: `${child.stdout}\n${child.stderr}`, evidenceDir };
}

/**
 * The environment a child run gets: without this worker's identity, or Playwright treats it as nested
 * inside the current run, and without this run's GitHub environment, or it appends to its summary.
 *
 * @returns The environment.
 */
function childEnv(): Record<string, string> {
  return Object.fromEntries(Object.entries(process.env)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .filter(([key]) => !/^(PW_|PLAYWRIGHT_|TEST_WORKER_|TEST_PARALLEL_|GITHUB_|A11Y_)/.test(key)));
}

test.describe('the reporter of the checks beyond axe', () => {
  // Each case spawns a whole Playwright child run; the default 20s budget cannot hold that.
  test.describe.configure({ timeout: 120_000 });

  test('writes one document per check: measured targets, a failed test as an error target, a retried one flagged', async() => {
    const trap = { kind: 'keyboard-trap', criteria: ['2.1.2'], severity: 'serious', selector: 'td.current', reason: 'Tab never left the grid' };
    const { status, output, evidenceDir } = runSyntheticCheck('merge', [
      checkTest('grid on main', 'grid', [], [trap]),
      checkTest('dialog on main', 'dialog', []),
      checkTest('menu on main', 'menu', ['throw new Error(\'the menu did not open\');']),
      checkTest('editor on main', 'editor', ['if (testInfo.retry === 0) throw new Error(\'a first attempt that failed\');']),
    ].join('\n'));

    expect(output).toContain('a11y-checks: demo-check: 1 findings on 3 targets measured, 1 not measured');
    expect(status, 'the reporter keeps Playwright\'s own status: a test that did not measure is a tooling failure').toBe(1);

    const doc = JSON.parse(readFileSync(path.join(evidenceDir, 'demo-check.json'), 'utf8'));

    expect(doc.run.commit, 'the head commit on CI, not the merge commit').toBe('abc1234');
    expect(doc.targets.map((target: { page: string; status: string; flaky: boolean }) => [target.page, target.status, target.flaky])).toEqual([
      ['dialog', 'measured', false],
      ['editor', 'measured', true],
      ['grid', 'measured', false],
      ['menu', 'error', false],
    ]);
    expect(doc.findings.map((finding: { id: string }) => finding.id)).toEqual(['demo-check|keyboard-trap|grid|main||td.current']);
    expect(doc.problems).toEqual([
      'menu on main did not measure: Error: the menu did not open',
      'editor on main measured only on a retry (a flaky check is a finding against the check): Error: a first attempt that failed',
    ]);
    expect(doc.summary.byCriterion['2.1.2']).toEqual({ name: 'No Keyboard Trap', level: 'A', evaluated: 3, findings: 1, pages: ['grid'] });
    expect(JSON.parse(readFileSync(path.join(evidenceDir, 'demo-check', 'grid--main.json'), 'utf8'))).toEqual({ stops: ['grid'] });
    expect(existsSync(path.join(evidenceDir, 'summary.md'))).toBe(true);
  });

  test('a test skipped by a failed beforeAll, and a part that is not JSON or is malformed, are error targets', async() => {
    const malformed = { kind: 'Not Kebab', criteria: ['2.1.2'], severity: 'serious', selector: 'td', reason: 'x' };
    const { evidenceDir } = runSyntheticCheck('unmeasured', [
      checkTest('grid on main', 'grid', []),
      checkTest('menu on main', 'menu', [], [], '{ not json'),
      checkTest('dialog on main', 'dialog', [], [malformed]),
      'test.describe(\'a group whose setup fails\', () => {',
      '  test.beforeAll(() => { throw new Error(\'the fixture server did not start\'); });',
      checkTest('table on main', 'table', []),
      checkTest('chart on main', 'chart', []),
      '});',
      'test.skip(\'skipped on purpose\', () => {});',
    ].join('\n'));
    const doc = JSON.parse(readFileSync(path.join(evidenceDir, 'demo-check.json'), 'utf8'));

    expect([doc.summary.targets, doc.summary.measured, doc.summary.errors], 'every test but the intentional skip is a target').toEqual([5, 1, 4]);
    expect(doc.problems).toEqual(expect.arrayContaining([
      expect.stringMatching(/^menu on main did not measure: the evidence part is not readable JSON/),
      'dialog on main did not measure: the evidence part is malformed: findings[0].kind is not a kebab-case id',
      expect.stringMatching(/^table on main did not measure: .*the fixture server did not start/),
      expect.stringMatching(/^chart on main did not measure: /),
    ]));
    expect(existsSync(path.join(evidenceDir, 'demo-check', 'dialog--main.json')), 'a malformed part writes no detail file').toBe(false);
  });

  test('a test the run never started, after maxFailures stopped it, is an error target', async() => {
    const { evidenceDir } = runSyntheticCheck('stopped', [
      // No retry, so the first failure is the one that stops the run.
      'test.describe.configure({ retries: 0 });',
      checkTest('menu on main', 'menu', ['throw new Error(\'the menu did not open\');']),
      checkTest('grid on main', 'grid', []),
    ].join('\n'), { maxFailures: 1 });
    const doc = JSON.parse(readFileSync(path.join(evidenceDir, 'demo-check.json'), 'utf8'));

    expect(doc.targets.map((target: { page: string | null; status: string }) => [target.page, target.status])).toEqual([['menu', 'error'], [null, 'error']]);
    expect(doc.problems).toContain('grid on main did not measure: the test did not run: the run stopped before it started (maxFailures, the global timeout or an interrupt)');
    expect(doc.summary.errors).toBe(2);
  });

  test('a triage check\'s part may hold a record that names no criterion, and its document counts no criterion', async() => {
    const practice = { kind: 'axe-violation', criteria: [], severity: 'moderate', selector: 'div.region', reason: 'All page content should be contained by landmarks' };
    const contrast = { kind: 'axe-violation', criteria: ['1.4.3'], severity: 'serious', selector: 'td.low', reason: 'Elements must meet minimum color contrast ratio thresholds' };
    const { evidenceDir } = runSyntheticCheck('triage', checkTest('grid on main', 'grid', [], [practice, contrast]),
      { checks: { 'demo-check': { title: 'Demo triage', criteria: [], triage: true } } });
    const doc = JSON.parse(readFileSync(path.join(evidenceDir, 'demo-check.json'), 'utf8'));

    expect(doc.targets.map((target: { page: string; status: string }) => [target.page, target.status]), 'the part is valid on a triage check')
      .toEqual([['grid', 'measured']]);
    expect(doc.problems).toEqual([]);
    expect(doc.triage).toBe(true);
    expect(doc.summary.findings).toBe(2);
    expect(doc.summary.byCriterion, 'a triage record is not evidence the conformance report cites').toEqual({});
  });

  test('a part is never attached for a page that threw while it was measured', async() => {
    const target = { page: 'grid', theme: 'main' };
    const { evidenceDir } = runSyntheticCheck('page-error', [
      `import { attachEvidence } from ${JSON.stringify(pathToFileURL(path.join(testsRoot, 'a11y/evidence.ts')).href)};`,
      'test(\'grid on main\', async({}, testInfo) => {',
      `  testInfo.annotations.push({ type: 'a11y-target', description: ${JSON.stringify(JSON.stringify(target))} });`,
      '  await attachEvidence(testInfo, {',
      `    target: ${JSON.stringify(target)}, startedAt: Date.now(), findings: [], pageErrors: ['TypeError: a focus handler threw'],`,
      '    environment: { browser: \'chromium\', browserVersion: null, handsontableVersion: null, handsontableBuildDate: null },',
      '  });',
      '});',
    ].join('\n'));
    const doc = JSON.parse(readFileSync(path.join(evidenceDir, 'demo-check.json'), 'utf8'));

    expect(doc.targets.map((item: { page: string; status: string }) => [item.page, item.status])).toEqual([['grid', 'error']]);
    expect(doc.problems[0]).toMatch(/^grid on main did not measure: .*the page threw no error while it was measured/);
  });

  test('the report script turns a document it cannot validate into a neutral check run, never a failure', async() => {
    const { evidenceDir } = runSyntheticCheck('script', checkTest('grid on main', 'grid', []));
    const child = spawnSync(process.execPath, [reportScript, '--dry-run'], {
      cwd: testsRoot,
      env: { ...childEnv(), A11Y_EVIDENCE_DIR: evidenceDir, A11Y_CHECKS: 'demo-check,missing-check' },
      encoding: 'utf8',
      timeout: 30_000,
    });

    expect(child.status, child.stderr).toBe(0);

    const payloads = JSON.parse(child.stdout.slice(child.stdout.indexOf('[')));

    // `demo-check` is registered only in the synthetic reporter's options, so the script, which reads
    // the real registry, cannot validate its document: a tooling check run, neutral.
    expect(payloads.map((payload: { name: string; conclusion: string; title: string }) => [payload.name, payload.conclusion, payload.title])).toEqual([
      ['A11y / demo-check report', 'neutral', '⚠ Tooling: demo-check.json: check "demo-check" is not in EVIDENCE_CHECKS'],
      ['A11y / missing-check report', 'neutral',
        '⚠ Tooling: the missing-check check left no test-results/a11y-checks/missing-check.json: no test of it ran to the end'],
    ]);
  });

  test('the report script tries every check run when the API refuses one', async() => {
    const { evidenceDir } = runSyntheticCheck('post', checkTest('grid on main', 'grid', []));
    const child = spawnSync(process.execPath, [reportScript, '--check-run'], {
      cwd: testsRoot,
      env: {
        ...childEnv(), A11Y_EVIDENCE_DIR: evidenceDir, A11Y_CHECKS: 'demo-check,missing-check',
        // fetch refuses port 1, so every post fails, the way one the API refuses does.
        GITHUB_TOKEN: 'token', GITHUB_REPOSITORY: 'o/r', A11Y_HEAD_SHA: 'abc1234', GITHUB_API_URL: 'http://127.0.0.1:1',
      },
      encoding: 'utf8',
      timeout: 30_000,
    });

    expect(child.status, 'a refused post still ends the step red').toBe(1);
    expect(child.stderr).toContain('"A11y / demo-check report" was not posted');
    expect(child.stderr).toContain('"A11y / missing-check report" was not posted');
  });
});
