import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/**
 * The proof that the reporter of the checks beyond axe (`reporters/a11y-checks.ts`) turns what a run's
 * tests attached into the evidence document `tests/AGENTS.md` describes ("A11y: the checks beyond
 * axe"), and that the report script posts it as a check run that is never a failure. The merge itself
 * is unit-tested in `lib/__tests__/a11y-evidence.test.mjs`; this is the step around it that only a real
 * run shows: which attempt is read, a failed test recorded as a target that was not measured, a test
 * that passed on a retry flagged, a target's detail written to its own file.
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
 * @returns The test's source.
 */
function checkTest(title: string, page: string, body: string[], findings: object[] = []): string {
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
    `  writeFileSync(file, ${JSON.stringify(JSON.stringify(part))});`,
    '  await testInfo.attach(\'a11y-evidence\', { path: file, contentType: \'application/json\' });',
    '});',
  ].join('\n');
}

/**
 * Writes and runs one synthetic project named `demo-check`.
 *
 * @param name The case name, also the directory name under `test-results/`.
 * @param specSource The synthetic spec's tests; `test`, `expect` and `writeFileSync` are imported.
 * @returns The child's exit status and output, and where the reporter wrote.
 */
function runSyntheticCheck(name: string, specSource: string) {
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
    `  reporter: [['dot'], [${JSON.stringify(reporterPath)}, ${JSON.stringify({ checks: CHECKS, outputDir: evidenceDir })}]],`,
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

  test('the report script turns a document it cannot validate into a neutral check run, never a failure', async() => {
    const { evidenceDir } = runSyntheticCheck('script', checkTest('grid on main', 'grid', []));
    const child = spawnSync(process.execPath, [reportScript, '--dry-run'], {
      cwd: testsRoot,
      env: { ...childEnv(), A11Y_EVIDENCE_DIR: evidenceDir, A11Y_CHECKS: 'demo-check,missing-check' },
      encoding: 'utf8',
      timeout: 30_000,
    });
    const payloads = JSON.parse(child.stdout.slice(child.stdout.indexOf('[')));

    expect(child.status).toBe(0);
    // `demo-check` is registered only in the synthetic reporter's options, so the script, which reads
    // the real registry, cannot validate its document: a tooling check run, neutral.
    expect(payloads.map((payload: { name: string; conclusion: string; title: string }) => [payload.name, payload.conclusion, payload.title])).toEqual([
      ['A11y / demo-check report', 'neutral', '⚠ Tooling: demo-check.json: check "demo-check" is not in EVIDENCE_CHECKS'],
      ['A11y / missing-check report', 'neutral',
        '⚠ Tooling: the missing-check check left no test-results/a11y-checks/missing-check.json: no test of it ran to the end'],
    ]);
  });
});
