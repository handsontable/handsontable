// Golden snapshot I/O -- save and load performance baselines.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { exists } from './fs-utils.mjs';
import {
  computeMedianSnapshot, isValidForMedian, MEDIAN_WINDOW_SIZE, MIN_VALID_SNAPSHOTS,
} from './median-snapshot.mjs';
import {
  DEFAULT_MEASUREMENT_VERSION,
  baselineKey,
  describeKeyMismatch,
  isCompatibleBaseline,
  isCompleteKey,
} from './environment.mjs';

// The refusal when the goldens match this run's browser and harness but measure every scenario at
// another `measurementVersion` -- each scenario redefined since they were recorded.
export const SCENARIO_VERSIONS_MISMATCH_REASON = 'the compatible develop goldens measure every '
  + 'scenario at a different version than this run (the scenarios were redefined); deltas resume '
  + 'once two develop pushes have run with the current definitions';

const DEFAULT_GOLDEN_DIR = join(import.meta.dirname, '..', 'golden');

/**
 * @param {string} goldenDir
 * @returns {{goldenPath: string, historyDir: string}}
 */
function paths(goldenDir) {
  return {
    goldenPath: join(goldenDir, 'snapshots.json'),
    // Populated by the CI restore step with the last N timestamped develop golden snapshots
    // fetched from gh-pages. Read in both modes: a compare run medians over it, and a golden
    // (develop-push) run compares the snapshot it just recorded against it for the report --
    // the saved snapshot itself is never derived from history, see teardown.mjs.
    historyDir: join(goldenDir, 'history'),
  };
}

/**
 * @param {Record<string, object>} scenarioResults -- keyed by scenario name
 * @param {object} [metadata]
 * @param {string} [goldenDir] -- override for tests; defaults to the real golden dir
 * @returns {Promise<string>} path to saved file
 */
export async function saveSnapshots(scenarioResults, metadata = {}, goldenDir = DEFAULT_GOLDEN_DIR) {
  const { goldenPath } = paths(goldenDir);
  const snapshot = {
    timestamp: new Date().toISOString(),
    ...metadata,
    scenarios: scenarioResults,
  };

  await mkdir(goldenDir, { recursive: true });
  await writeFile(goldenPath, JSON.stringify(snapshot, null, 2), 'utf8');

  return goldenPath;
}

/**
 * Loads the baseline a run should be compared against, and says why when there is none.
 *
 * Preference order: a median over the compatible goldens in history/, then the single-file golden
 * if it is compatible, then nothing. "Compatible" is the key from lib/environment.mjs -- same
 * Chromium build, same harness version -- when `compatibleWith` is given; without it, everything
 * marks-valid qualifies, as before provenance existed.
 *
 * A baseline that exists but is incompatible is refused, not returned: a delta against a golden
 * from another Chromium is the two browsers disagreeing, and publishing it is the defect that made
 * the 09-03 Playwright bump read as a regression on five days of pull requests. The refusal is
 * returned as a reason so the report can print it instead of a self-comparison nobody can read.
 *
 * @param {string} [goldenDir] -- override for tests; defaults to the real golden dir
 * @param {object} [options]
 * @param {{ key: object, scenarioVersions?: Record<string, number> } | null} [options.compatibleWith]
 * @param {boolean} [options.allowSingleFile=true] -- whether golden/snapshots.json may serve as the
 *   fallback. A golden-mode run passes false: there the file is the snapshot the run itself just
 *   saved, and comparing a run against itself reports 0% everywhere.
 * @returns {Promise<{ snapshot: object | null, unavailableReason: string | null }>}
 */
export async function loadBaseline(
  goldenDir = DEFAULT_GOLDEN_DIR, { compatibleWith = null, allowSingleFile = true } = {}
) {
  const { goldenPath, historyDir } = paths(goldenDir);
  const goldenPathExists = allowSingleFile && await exists(goldenPath);
  let incompatible = null;
  let versionsMismatch = false;

  if (await exists(historyDir)) {
    const median = await loadMedianFromHistory(historyDir, goldenPathExists, compatibleWith);

    if (median.snapshot) {
      return { snapshot: median.snapshot, unavailableReason: null };
    }

    incompatible = median.incompatibleExample;
    versionsMismatch = median.versionsMismatch;
  }

  if (!goldenPathExists) {
    return { snapshot: null, unavailableReason: reasonFor(compatibleWith, incompatible, versionsMismatch) };
  }

  let single;

  try {
    single = JSON.parse(await readFile(goldenPath, 'utf8'));
  } catch (err) {
    console.warn(`Warning: failed to parse golden snapshots (${err.message}) -- running without baseline`);

    return { snapshot: null, unavailableReason: null };
  }

  if (compatibleWith && !isCompatibleBaseline(single, compatibleWith.key)) {
    return { snapshot: null, unavailableReason: reasonFor(compatibleWith, single, false) };
  }

  // Same browser and harness, but no scenario at a version this run measures: nothing in it can be
  // compared. A partial overlap is returned; the teardown withholds the mismatched scenarios one by
  // one, the way it does for a window mismatch.
  if (compatibleWith && !sharesAnyScenarioVersion(single, compatibleWith.scenarioVersions)) {
    return { snapshot: null, unavailableReason: reasonFor(compatibleWith, null, true) };
  }

  return { snapshot: single, unavailableReason: null };
}

/**
 * @param {object} snapshot
 * @param {Record<string, number> | undefined} scenarioVersions -- the current run's, per scenario
 * @returns {boolean} whether at least one scenario in the snapshot is at the version this run measures
 */
function sharesAnyScenarioVersion(snapshot, scenarioVersions) {
  if (!scenarioVersions) {
    return true;
  }

  return Object.entries(snapshot.scenarios || {}).some(([name, entry]) => {
    if (!(name in scenarioVersions)) {
      // A scenario this run did not measure has no version to disagree with; it is neither a match
      // nor a mismatch, so it does not decide the answer.
      return false;
    }

    return (entry?.measurementVersion ?? DEFAULT_MEASUREMENT_VERSION) === scenarioVersions[name];
  }) || Object.keys(snapshot.scenarios || {}).every(name => !(name in scenarioVersions));
}

/**
 * Backwards-compatible shape: the snapshot alone, or null.
 *
 * @param {string} [goldenDir]
 * @param {object} [options] -- as for loadBaseline
 * @returns {Promise<object | null>}
 */
export async function loadSnapshots(goldenDir = DEFAULT_GOLDEN_DIR, options = {}) {
  const { snapshot } = await loadBaseline(goldenDir, options);

  return snapshot;
}

/**
 * @param {{ key: object } | null} compatibleWith
 * @param {object | null} incompatible -- a golden that was refused for its key, if one was seen
 * @param {boolean} versionsMismatch -- goldens matched the key but no scenario matched its version
 * @returns {string | null}
 */
function reasonFor(compatibleWith, incompatible, versionsMismatch) {
  if (!compatibleWith) {
    return null;
  }

  if (versionsMismatch) {
    return SCENARIO_VERSIONS_MISMATCH_REASON;
  }

  if (!incompatible) {
    return null;
  }

  return describeKeyMismatch(compatibleWith.key, baselineKey(incompatible));
}

/**
 * @returns {number | null}
 */
function envWindowSize() {
  const raw = process.env.PERF_MEDIAN_WINDOW_SIZE;

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

/**
 * @param {string} historyDir
 * @param {boolean} goldenPathExists -- whether a single-file golden is actually there to fall back to
 * @param {{ key: object, scenarioVersions?: Record<string, number> } | null} compatibleWith
 * @returns {Promise<{ snapshot: object | null, incompatibleExample: object | null,
 *   versionsMismatch: boolean }>}
 */
async function loadMedianFromHistory(historyDir, goldenPathExists, compatibleWith) {
  const files = (await readdir(historyDir)).filter(name => name.endsWith('.json'));

  const parsed = await Promise.all(files.map(async(file) => {
    try {
      return JSON.parse(await readFile(join(historyDir, file), 'utf8'));
    } catch (err) {
      console.warn(`Warning: failed to parse golden history file ${file} (${err.message}) -- skipping`);

      return null;
    }
  }));

  const snapshots = parsed.filter(Boolean);
  const windowSize = envWindowSize() ?? MEDIAN_WINDOW_SIZE;
  const median = computeMedianSnapshot(snapshots, { windowSize, compatibleWith });

  if (median) {
    if (median.excludedIncompatible > 0) {
      console.log(
        `Golden history: ${median.excludedIncompatible} snapshot(s) passed over for a different ` +
        'Chromium build or harness version.'
      );
    }

    return { snapshot: median, incompatibleExample: null, versionsMismatch: false };
  }

  const keyed = compatibleWith && isCompleteKey(compatibleWith.key);
  // Enough goldens matched the key, yet no median came out: the per-scenario version filter
  // emptied it. That is a different message from "wrong browser", and it must not be silent.
  const versionsMismatch = !!keyed
    && snapshots.filter(s => isValidForMedian(s) && isCompatibleBaseline(s, compatibleWith.key)).length
      >= MIN_VALID_SNAPSHOTS;
  // The newest golden that was refused for its key, so the report can name what changed.
  const incompatibleExample = keyed && !versionsMismatch
    ? snapshots
      .filter(s => !isCompatibleBaseline(s, compatibleWith.key))
      .sort((a, b) => Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0))[0] ?? null
    : null;

  if (snapshots.length > 0) {
    const fallback = goldenPathExists
      ? 'falling back to latest.json if it is compatible'
      : 'no single-file golden either, running without baseline';
    let cause = 'not enough snapshots had a marked trace window on every scenario';

    if (versionsMismatch) {
      cause = 'the snapshots matching this run\'s environment measure every scenario at another version';
    } else if (incompatibleExample) {
      cause = 'not enough snapshots matched this run\'s Chromium build and harness version';
    }

    console.warn(`Golden history present but ${cause} -- ${fallback}`);
  }

  return { snapshot: null, incompatibleExample, versionsMismatch };
}
