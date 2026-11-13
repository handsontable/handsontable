import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/**
 * The proof that the a11y reporter sets the exit status the way `tests/AGENTS.md` says ("A11y: the
 * axe scan and its baseline"): in warn mode a finding never fails the run, and a failed test, a run
 * that completed no scan and a baseline that does not validate always do; in block mode a finding
 * that needs action fails it too. The comparator's sets are unit-tested in
 * `lib/__tests__/a11y-baseline.test.mjs`; this is the step after them, the status Playwright exits
 * with, which only a real run shows (the last reporter's `onEnd` replaces the run's status).
 *
 * Each case writes a tiny Playwright project under `test-results/`: a config whose last reporter is
 * `reporters/a11y.ts` with its `baseline` and `mode` options, a baseline, and a synthetic spec whose
 * tests attach a hand-written scan the way `a11y/axe.spec.ts` attaches axe's. No browser runs, so
 * the whole proof costs a few seconds.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const testsRoot = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');
const reporterPath = path.join(testsRoot, 'reporters/a11y.ts');

const ISSUE = { id: 'grid-roles', title: 'The grid root holds children its role does not allow' };
const ENTRY = {
  page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]',
  impact: 'critical', nodes: 1, issue: ISSUE.id,
};
const BASELINE = { axeCoreVersion: '4.14.0', issues: [ISSUE], entries: [ENTRY] };

// What axe reports for the baselined finding, and for one the baseline does not know.
const KNOWN = {
  id: 'aria-required-children', impact: 'critical', help: 'Certain ARIA roles must contain particular children',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/aria-required-children', tags: ['wcag2a', 'wcag131'],
  nodes: [{ target: ['#ht_1'], html: '<div class="ht-wrapper" role="treegrid">', failureSummary: 'Fix any of the following' }],
};
const UNKNOWN = {
  id: 'label', impact: 'critical', help: 'Form elements must have labels',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/label', tags: ['wcag2a', 'wcag412'],
  nodes: [{ target: ['textarea'], html: '<textarea class="handsontableInput">', failureSummary: 'Fix any of the following' }],
};

type Violation = typeof KNOWN;

/**
 * The source of one synthetic test that attaches a scan of the `grid` page on the main theme, as
 * the real spec does: a JSON file named `axe-scan`.
 *
 * @param title The test title.
 * @param violations What the scan found.
 * @returns The test's source.
 */
function scanTest(title: string, violations: Violation[]): string {
  const scan = { page: 'grid', theme: 'main', fixture: 'grid.html', axeCoreVersion: '4.14.0', screenshot: null, violations };

  return [
    `test(${JSON.stringify(title)}, async({}, testInfo) => {`,
    '  const file = testInfo.outputPath(\'scan.json\');',
    `  writeFileSync(file, ${JSON.stringify(JSON.stringify(scan))});`,
    '  await testInfo.attach(\'axe-scan\', { path: file, contentType: \'application/json\' });',
    '});',
  ].join('\n');
}

/**
 * Writes and runs one synthetic project.
 *
 * @param name The case name, also the directory name under `test-results/`.
 * @param options The case.
 * @param options.specSource The synthetic spec's tests; `test`, `expect` and `writeFileSync` are imported.
 * @param options.baseline The baseline the reporter reads (an object, or raw text).
 * @param options.mode The reporter's `mode` option.
 * @param options.env Extra environment for the child.
 * @returns The child's exit status and combined output.
 */
function runSyntheticProject(name: string, { specSource, baseline = BASELINE, mode = 'warn', env: extraEnv = {} }: {
  specSource: string;
  baseline?: object | string;
  mode?: string;
  env?: Record<string, string>;
}) {
  // The directory carries the project and worker of the running test, so a full-matrix run, which
  // runs this file on every leg, never has two workers writing the same synthetic tree.
  const info = test.info();
  const dir = path.join(testsRoot, 'test-results', `a11y-reporter-proof-${name}-${info.project.name}-w${info.workerIndex}`);
  const baselineFile = path.join(dir, 'baseline.json');

  mkdirSync(dir, { recursive: true });
  writeFileSync(baselineFile, typeof baseline === 'string' ? baseline : `${JSON.stringify(baseline, null, 2)}\n`);
  writeFileSync(path.join(dir, 'playwright.config.mjs'), [
    'export default {',
    `  testDir: ${JSON.stringify(dir)},`,
    `  outputDir: ${JSON.stringify(path.join(dir, 'output'))},`,
    '  retries: 0,',
    '  workers: 1,',
    `  reporter: [['dot'], [${JSON.stringify(reporterPath)}, ${JSON.stringify({ baseline: baselineFile, mode })}]],`,
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

  // The child must not inherit this worker's identity, or Playwright treats it as nested inside the
  // current run; and it must not see this run's GitHub environment, or it appends to its summary.
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !/^(PW_|PLAYWRIGHT_|TEST_WORKER_|TEST_PARALLEL_|GITHUB_|A11Y_)/.test(key)));
  const child = spawnSync(process.execPath, [playwrightCli, 'test', '-c', path.join(dir, 'playwright.config.mjs')], {
    cwd: testsRoot,
    env: { ...env, CI: '1', FORCE_COLOR: '0', ...extraEnv },
    encoding: 'utf8',
    timeout: 90_000,
  });

  return { status: child.status, output: `${child.stdout}\n${child.stderr}` };
}

test.describe('a11y reporter exit status', () => {
  // Each case spawns a whole Playwright child run; the default 20s test budget cannot hold that,
  // and an exhausted `spawnSync` guard would surface as a null status rather than the real reason.
  test.describe.configure({ timeout: 120_000 });

  test('a new finding in warn mode is reported and the run passes', async() => {
    const { status, output } = runSyntheticProject('warn-new', { specSource: scanTest('scan', [KNOWN, UNKNOWN]) });

    expect(output).toContain('1 new (warn mode)');
    expect(status).toBe(0);
  });

  test('a test that fails fails the run in warn mode, whatever the scans found', async() => {
    const { status, output } = runSyntheticProject('warn-failed-test', {
      specSource: [scanTest('scan', [KNOWN]), 'test(\'opener\', async() => { expect(1).toBe(2); });'].join('\n'),
    });

    expect(output).toContain('1 failed');
    expect(output).toContain('No new accessibility findings');
    expect(status).toBe(1);
  });

  test('a run that attached no scan fails, because it proved nothing', async() => {
    const { status, output } = runSyntheticProject('no-scan', { specSource: 'test(\'passes\', async() => { expect(1).toBe(1); });' });

    expect(output).toContain('1 passed');
    expect(output).toContain('no scan completed');
    expect(status).toBe(1);
  });

  test('a baseline that does not validate fails the run, and so does one that is not JSON', async() => {
    const invalid = runSyntheticProject('invalid-baseline', {
      specSource: scanTest('scan', [KNOWN]),
      baseline: { ...BASELINE, entries: [{ ...ENTRY, page: 'no-such-page' }] },
    });

    expect(invalid.output).toContain('page "no-such-page" is not in the scan list');
    expect(invalid.status).toBe(1);

    const broken = runSyntheticProject('broken-baseline', { specSource: scanTest('scan', [KNOWN]), baseline: '{ "entries": [' });

    expect(broken.output).toContain('is not valid JSON');
    expect(broken.status).toBe(1);
  });

  test('block mode fails the run on a new finding, and passes it when every finding is known', async() => {
    const blocked = runSyntheticProject('block-new', { specSource: scanTest('scan', [KNOWN, UNKNOWN]), mode: 'block' });

    expect(blocked.output).toContain('1 new (block mode)');
    expect(blocked.status).toBe(1);

    const known = runSyntheticProject('block-known', { specSource: scanTest('scan', [KNOWN]), mode: 'block' });

    expect(known.output).toContain('No new accessibility findings');
    expect(known.status).toBe(0);
  });

  test('a tooling problem prints as one escaped annotation on GitHub Actions', async() => {
    // A problem quotes the baseline, so a value with a newline or a percent sign reaches the
    // workflow command. Unescaped, the newline would end the annotation at "bad".
    const { status, output } = runSyntheticProject('annotations', {
      specSource: scanTest('scan', [KNOWN]),
      baseline: { ...BASELINE, entries: [{ ...ENTRY, page: 'bad\n100%' }] },
      env: { GITHUB_ACTIONS: 'true' },
    });
    const annotation = output.split('\n').find(line => line.startsWith('::error title=A11y axe%3A tooling::'));

    expect(annotation).toContain('page "bad%0A100%25" is not in the scan list');
    expect(status).toBe(1);
  });
});
