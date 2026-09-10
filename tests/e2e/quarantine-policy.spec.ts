import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { QUARANTINE_CAP } from '../lib/quarantine-policy.mjs';

/**
 * The proof that the quarantine policy changes the exit code the way it says
 * (`tests/AGENTS.md`, "Quarantine"). Each case writes a tiny Playwright project
 * under `test-results/` — one config with `retries: 1` and `failOnFlakyTests`,
 * the quarantine reporter, and a synthetic spec — and runs it in a child
 * process. The synthetic tests use no browser (no `page`), so the whole proof
 * costs a few seconds and needs nothing this suite does not already have.
 *
 * A "flaky" synthetic test is deterministic: it throws on the first attempt and
 * passes on the retry, which is exactly the outcome Playwright calls flaky.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const testsRoot = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');
const reporterPath = path.join(testsRoot, 'reporters/quarantine.ts');
const helperPath = path.join(testsRoot, 'fixtures/quarantine.ts');

const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + (days * DAY_MS)).toISOString().slice(0, 10);

/**
 * Writes and runs one synthetic project.
 *
 * @param name The case name, also the directory name under `test-results/`.
 * @param specSource The synthetic spec's source; `quarantined` is already imported.
 * @returns The child's exit status and combined output.
 */
function runSyntheticProject(name: string, specSource: string) {
  // The six e2e projects run this file in parallel (`fullyParallel`), so the dir carries the
  // project and worker of the running test — two workers never write the same synthetic tree.
  const info = test.info();
  const dir = path.join(
    testsRoot, 'test-results', `quarantine-proof-${name}-${info.project.name}-w${info.workerIndex}`
  );

  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'playwright.config.mjs'), [
    'export default {',
    `  testDir: ${JSON.stringify(dir)},`,
    `  outputDir: ${JSON.stringify(path.join(dir, 'output'))},`,
    '  retries: 1,',
    '  failOnFlakyTests: true,',
    '  workers: 1,',
    `  reporter: [['dot'], [${JSON.stringify(reporterPath)}]],`,
    '};',
    '',
  ].join('\n'));
  writeFileSync(path.join(dir, 'synthetic.spec.mjs'), [
    'import { test, expect } from \'@playwright/test\';',
    `import { quarantined } from ${JSON.stringify(helperPath)};`,
    '',
    specSource,
    '',
  ].join('\n'));

  // The child must not inherit this worker's identity, or Playwright treats it
  // as nested inside the current run.
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !/^(PW_|PLAYWRIGHT_|TEST_WORKER_|TEST_PARALLEL_)/.test(key)));
  const child = spawnSync(process.execPath, [playwrightCli, 'test', '-c', path.join(dir, 'playwright.config.mjs')], {
    cwd: testsRoot,
    env: { ...env, CI: '1', GITHUB_ACTIONS: '', GITHUB_OUTPUT: '', FORCE_COLOR: '0' },
    encoding: 'utf8',
    timeout: 90_000,
  });

  return { status: child.status, output: `${child.stdout}\n${child.stderr}` };
}

const FLAKY_BODY = [
  'async({}, testInfo) => {',
  '  if (testInfo.retry === 0) { throw new Error(\'first attempt\'); }',
  '  expect(1).toBe(1);',
  '}',
].join('\n');

test.describe('quarantine policy', () => {
  // Each case spawns a whole Playwright child run, and the last spawns two back to back; the default
  // 20s test budget cannot hold that, and an exhausted `spawnSync` guard would surface as a null
  // status rather than the real reason. `spawnSync` blocks the worker, so nothing here is truly async.
  test.describe.configure({ timeout: 200_000 });

  test('a flaky test without quarantine fails the run (the default this policy narrows)', async() => {
    const { status, output } = runSyntheticProject('plain-flaky', `test('flakes', ${FLAKY_BODY});`);

    expect(output).toContain('1 flaky');
    expect(status).toBe(1);
  });

  test('a flaky test under a live quarantine is reported and the run passes', async() => {
    const { status, output } = runSyntheticProject('quarantined-flaky', [
      `test('flakes', quarantined('DEV-2830', '${daysFromNow(10)}', 'synthetic'), ${FLAKY_BODY});`,
      'test(\'passes\', async() => { expect(2).toBe(2); });',
    ].join('\n'));

    expect(output).toContain('1 flaky');
    expect(output).toContain('quarantined flaky test, reported and not failing the run');
    expect(output).toContain('The run passes: every failure was a flaky test under a live quarantine');
    expect(status).toBe(0);
  });

  test('a flaky test whose quarantine expired fails the run again', async() => {
    const { status, output } = runSyntheticProject('expired',
      `test('flakes', quarantined('DEV-2830', '${daysFromNow(-1)}'), ${FLAKY_BODY});`);

    expect(output).toContain('expired on');
    expect(status).toBe(1);
  });

  test('the entry after the cap fails the run even when every test passes', async() => {
    const specs = Array.from({ length: QUARANTINE_CAP + 1 }, (_, index) =>
      `test('parked ${index}', quarantined('DEV-2830', '${daysFromNow(5)}'), async() => { expect(1).toBe(1); });`);
    const { status, output } = runSyntheticProject('over-cap', specs.join('\n'));

    expect(output).toContain(
      `quarantine cap exceeded: ${QUARANTINE_CAP + 1} tests are quarantined and the cap is ${QUARANTINE_CAP}`
    );
    expect(status).toBe(1);
  });

  test('a quarantine without a task id or beyond the horizon refuses to load', async() => {
    const { status, output } = runSyntheticProject('malformed',
      `test('parked', quarantined('flaky', '${daysFromNow(5)}'), async() => {});`);

    expect(output).toContain('a quarantine names the owning task id');
    expect(status).toBe(1);

    const farFuture = runSyntheticProject('far-future',
      `test('parked', quarantined('DEV-2830', '${daysFromNow(60)}'), async() => {});`);

    expect(farFuture.output).toContain('a quarantine expires within 30 days');
    expect(farFuture.status).toBe(1);
  });
});
