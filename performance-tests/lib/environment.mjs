// Provenance of a performance run, and the rule for which goldens a run may be compared against.
//
// Replaying the develop goldens on gh-pages showed that the numbers move for reasons that have
// nothing to do with the grid: the Playwright 1.58 -> 1.62 bump (a new Chromium) shifted
// initial-load by -18% and sorting by -20% in a single develop push, and the median-of-5 baseline
// then carried the old browser's numbers for five more pushes, so every unrelated pull request in
// between was told it had regressed or improved. Nothing in the snapshot said which browser had
// produced it, so nothing could have refused the comparison.
//
// This module records that provenance and turns the parts of it that redefine the measurement into
// a compatibility key. A baseline is only drawn from goldens whose key matches the run under test.

import os from 'node:os';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { HARNESS_VERSION } from './trace-runner.mjs';
import { exists } from './fs-utils.mjs';

// Written by the Playwright globalSetup (lib/setup.mjs) into output/, read by the teardown.
export const ENVIRONMENT_FILE = 'environment.json';

// A scenario config that does not declare one measures version 1. Kept explicit in every shipped
// scenario.config.mjs anyway, so the field is discoverable where it has to be bumped.
export const DEFAULT_MEASUREMENT_VERSION = 1;

/**
 * Describes the machine and browser a run executed on.
 *
 * `runnerImage` comes from the `ImageOS` / `ImageVersion` variables GitHub-hosted runners export;
 * both are absent on a self-hosted or local machine and the field is null there. The CPU model is
 * recorded so a later replay can test whether the 0.63x-1.12x per-run speed factor seen across
 * develop goldens tracks a hardware SKU, which nothing recorded so far could answer.
 *
 * @param {object} options
 * @param {string | null} options.chromium -- `browser.version()` of the Chromium the scenarios ran in
 * @param {NodeJS.ProcessEnv} [options.env]
 * @returns {{ chromium: string | null, cpuModel: string | null, cpuCount: number,
 *   memoryGiB: number, platform: string, runnerImage: string | null }}
 */
export function collectEnvironment({ chromium, env = process.env }) {
  const cpus = os.cpus();
  const imageOs = env.ImageOS || null;
  const imageVersion = env.ImageVersion || null;
  let runnerImage = null;

  if (imageOs && imageVersion) {
    runnerImage = `${imageOs} ${imageVersion}`;
  } else if (imageOs || imageVersion) {
    runnerImage = imageOs || imageVersion;
  }

  return {
    chromium: chromium || null,
    cpuModel: cpus[0]?.model?.trim() || null,
    cpuCount: cpus.length,
    memoryGiB: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
    platform: `${os.platform()} ${os.arch()}`,
    runnerImage,
  };
}

/**
 * @param {string} outputDir
 * @param {object} environment -- as returned by collectEnvironment
 */
export async function writeEnvironment(outputDir, environment) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, ENVIRONMENT_FILE), JSON.stringify(environment, null, 2), 'utf8');
}

/**
 * @param {string} outputDir
 * @returns {Promise<object | null>} null when the setup never wrote one
 */
export async function readEnvironment(outputDir) {
  const path = join(outputDir, ENVIRONMENT_FILE);

  if (!await exists(path)) {
    return null;
  }

  return JSON.parse(await readFile(path, 'utf8'));
}

/**
 * The parts of a snapshot's provenance that redefine what its numbers mean.
 *
 * Deliberately not the whole environment: a different CPU changes how fast the same work runs, which
 * is noise the median already smooths; a different Chromium or harness changes what work is
 * measured, which no amount of smoothing recovers from.
 *
 * @param {object | null | undefined} snapshot -- a golden snapshot, or the current run's metadata
 * @returns {{ chromium: string | null, harnessVersion: number | null }}
 */
export function baselineKey(snapshot) {
  return {
    chromium: snapshot?.environment?.chromium ?? null,
    harnessVersion: typeof snapshot?.harnessVersion === 'number' ? snapshot.harnessVersion : null,
  };
}

/**
 * @param {{ chromium: string | null, harnessVersion: number | null }} key
 * @returns {boolean} whether the key carries enough to be matched at all
 */
export function isCompleteKey(key) {
  return !!key && key.chromium != null && key.harnessVersion != null;
}

/**
 * Whether a golden may serve as a baseline for a run with the given key.
 *
 * Both sides must carry a complete key. A golden recorded before provenance existed has none, and
 * is excluded the same way a pre-marks golden is excluded by `windowSource`: by the absence of the
 * field, with no cutoff date to maintain.
 *
 * @param {object} snapshot
 * @param {{ chromium: string | null, harnessVersion: number | null }} key
 * @returns {boolean}
 */
export function isCompatibleBaseline(snapshot, key) {
  const own = baselineKey(snapshot);

  return isCompleteKey(own) && isCompleteKey(key)
    && own.chromium === key.chromium
    && own.harnessVersion === key.harnessVersion;
}

/**
 * @param {{ chromium: string | null, harnessVersion: number | null }} key
 * @returns {string} e.g. "Chromium 140.0.7339.16, harness 1"
 */
export function describeKey(key) {
  const chromium = key?.chromium ?? 'unknown Chromium';
  const harness = key?.harnessVersion ?? 'unversioned';

  return `Chromium ${chromium}, harness ${harness}`;
}

/**
 * Explains, for the comment footer, why a baseline was refused.
 *
 * @param {{ chromium: string | null, harnessVersion: number | null }} current
 * @param {{ chromium: string | null, harnessVersion: number | null }} baseline
 * @returns {string}
 */
export function describeKeyMismatch(current, baseline) {
  const differs = [];

  if (current.chromium !== baseline.chromium) {
    differs.push(`Chromium ${baseline.chromium ?? 'unknown'} -> ${current.chromium ?? 'unknown'}`);
  }

  if (current.harnessVersion !== baseline.harnessVersion) {
    differs.push(
      `harness ${baseline.harnessVersion ?? 'unversioned'} -> ${current.harnessVersion ?? 'unversioned'}`
    );
  }

  const change = differs.length > 0 ? differs.join(', ') : 'provenance differs';

  return `the develop goldens were recorded on a different environment (${change}); `
    + 'deltas resume once two develop pushes have run on the current one';
}

/**
 * The key of the run being torn down, from the environment file and the runner constant.
 *
 * @param {object | null} environment -- as read by readEnvironment
 * @returns {{ chromium: string | null, harnessVersion: number }}
 */
export function currentKey(environment) {
  return { chromium: environment?.chromium ?? null, harnessVersion: HARNESS_VERSION };
}

/**
 * Renders the environment for a footer: "Chromium 140.0.7339.16 · AMD EPYC 7763 ×4 · ubuntu24 20260901.1.0".
 *
 * @param {object | null | undefined} environment
 * @returns {string} empty when nothing is known
 */
export function formatEnvironment(environment) {
  if (!environment) {
    return '';
  }

  const parts = [];

  if (environment.chromium) {
    parts.push(`Chromium ${environment.chromium}`);
  }

  if (environment.cpuModel) {
    const cores = environment.cpuCount ? ` ×${environment.cpuCount}` : '';

    parts.push(`${environment.cpuModel}${cores}`);
  }

  if (environment.runnerImage) {
    parts.push(environment.runnerImage);
  }

  return parts.join(' · ');
}
