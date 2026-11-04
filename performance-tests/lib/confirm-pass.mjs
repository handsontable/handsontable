// Sets up the confirm re-run of the failing scenarios (see CONFIRM_MAX_SCENARIOS in lib/gate.mjs).
//
// The re-run is a second `playwright test` over those scenarios' spec files, so its global teardown
// runs again over output/. Each re-run scenario's first traces are moved under output/first-pass/
// first: the teardown reads only `iteration-*.json` files directly inside each output/<name>/, so it
// judges the re-run data, and the first traces stay in the uploaded artifact.

import { copyFile, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { exists } from './fs-utils.mjs';
import {
  GATE_FIRST_PASS_DIR,
  GATE_FIRST_PASS_FILE,
  GATE_VERDICT_FILE,
  confirmCandidates,
  isGatedRun,
} from './gate.mjs';

/**
 * @param {string} name -- scenario name, which is its directory (pinned by scenario-configs.test.mjs)
 * @returns {string} the spec file, relative to performance-tests/
 */
export function scenarioSpecPath(name) {
  // The path reaches a shell (run.mjs spawns Playwright with `shell: true`), so only a kebab-case
  // name, which every scenario directory is, gets through.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`Not a scenario name: ${JSON.stringify(name)}`);
  }

  return `scenarios/${name}/${name}.spec.ts`;
}

/**
 * Prepares output/ for the confirm re-run and says what to re-run.
 *
 * The first verdict is copied, not moved, so a re-run that dies before its teardown leaves the first
 * verdict standing rather than none.
 *
 * @param {string} outputDir -- performance-tests/output
 * @returns {Promise<string[]>} the spec files to re-run, relative to performance-tests/; empty when
 *   nothing failed, too much failed, or there is no verdict
 */
export async function prepareConfirmPass(outputDir) {
  const verdictPath = join(outputDir, GATE_VERDICT_FILE);

  if (!await exists(verdictPath)) {
    return [];
  }

  const names = confirmCandidates(JSON.parse(await readFile(verdictPath, 'utf8')));

  if (names.length === 0) {
    return [];
  }

  // Before anything moves: a name that is refused must leave output/ as the first pass wrote it.
  const files = names.map(scenarioSpecPath);

  await copyFile(verdictPath, join(outputDir, GATE_FIRST_PASS_FILE));

  const firstPassDir = join(outputDir, GATE_FIRST_PASS_DIR);

  await mkdir(firstPassDir, { recursive: true });

  for (const name of names) {
    const target = join(firstPassDir, name);

    // A local run repeated in the same checkout leaves the previous first pass behind.
    await rm(target, { recursive: true, force: true });
    await rename(join(outputDir, name), target);
  }

  return files;
}

/**
 * Runs the scenarios, then, on a run the gate acts on, re-runs the ones the gate failed.
 *
 * The re-run happens even when the first `playwright test` exited non-zero: its teardown still wrote
 * a verdict, and a would-fail left unconfirmed would read as a false fail in the warn-period count.
 * The first run's error is thrown after the re-run, so the job stays red for it.
 *
 * @param {object} options
 * @param {string} options.outputDir -- performance-tests/output
 * @param {Record<string, string | undefined>} options.env -- read for isGatedRun
 * @param {(files?: string[], env?: Record<string, string>) => Promise<void>} options.runPlaywright
 * @param {(message: string) => void} [options.log]
 * @returns {Promise<void>}
 */
export async function runWithConfirmPass({ outputDir, env, runPlaywright, log = console.log }) {
  // A verdict an earlier local run left must not choose what this run re-runs.
  await rm(join(outputDir, GATE_VERDICT_FILE), { force: true });
  await rm(join(outputDir, GATE_FIRST_PASS_FILE), { force: true });

  const firstError = await runPlaywright().then(() => null, error => error);

  if (isGatedRun(env)) {
    const files = await prepareConfirmPass(outputDir);

    if (files.length > 0) {
      log(`\n=== Re-running ${files.length} failing scenario(s) to confirm them ===\n`);
      await runPlaywright(files, { PERF_CONFIRM_PASS: '1' });
    }
  }

  if (firstError) {
    throw firstError;
  }
}
