// Golden snapshot I/O -- save and load performance baselines.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { exists } from './fs-utils.mjs';
import {
  MEDIAN_REFUSAL,
  MEDIAN_WINDOW_SIZE,
  computeMedianSnapshot,
  explainMedianRefusal,
} from './median-snapshot.mjs';
import {
  DEFAULT_MEASUREMENT_VERSION,
  RESUME_NOTE,
  baselineKey,
  describeKeyMismatch,
  isCompatibleBaseline,
} from './environment.mjs';

const DEFAULT_GOLDEN_DIR = join(import.meta.dirname, '..', 'golden');

// The refusals a reader can act on, one sentence each. The key mismatch is worded by
// describeKeyMismatch() because it names the two environments; everything else is fixed text.
export const BASELINE_REFUSALS = Object.freeze({
  [MEDIAN_REFUSAL.EMPTY_HISTORY]: 'no develop goldens were available to compare against (the history '
    + `fetch returned nothing); ${RESUME_NOTE}`,
  [MEDIAN_REFUSAL.NO_MARKS_VALID]: 'too few develop goldens carry a marked trace window on every '
    + `scenario; ${RESUME_NOTE}`,
  [MEDIAN_REFUSAL.VERSION_MISMATCH]: 'the compatible develop goldens measure every scenario at a '
    + `different version than this run (the scenarios were redefined); ${RESUME_NOTE}`,
  [MEDIAN_REFUSAL.DISJOINT_SCENARIOS]: 'the compatible develop goldens contain none of the scenarios '
    + `this run measured; ${RESUME_NOTE}`,
  'empty-golden': `the single-file develop golden carries no scenarios (a deploy cut short); ${RESUME_NOTE}`,
});

// Kept as a named export because the loader's tests and the teardown's footer both cite it.
export const SCENARIO_VERSIONS_MISMATCH_REASON = BASELINE_REFUSALS[MEDIAN_REFUSAL.VERSION_MISMATCH];

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
 * Chromium build, platform, and harness version -- when `compatibleWith` is given; without it, everything
 * marks-valid qualifies, as before provenance existed.
 *
 * A baseline that exists but is incompatible is refused, not returned: a delta against a golden
 * from another platform or Chromium is the two environments disagreeing, and publishing it is the defect that made
 * the 09-03 Playwright bump read as a regression on five days of pull requests. Every refusal comes
 * back as a reason so the report can print it instead of a self-comparison nobody can read --
 * including "there was nothing to compare against at all", which in golden mode has no other
 * surface than the footer.
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
  let historyRefusal = null;

  if (await exists(historyDir)) {
    const median = await loadMedianFromHistory(historyDir, goldenPathExists, compatibleWith);

    if (median.snapshot) {
      return { snapshot: median.snapshot, unavailableReason: null };
    }

    historyRefusal = median.refusal;
  }

  if (!goldenPathExists) {
    return { snapshot: null, unavailableReason: refusalText(historyRefusal, compatibleWith) };
  }

  let single;

  try {
    single = JSON.parse(await readFile(goldenPath, 'utf8'));
  } catch (err) {
    console.warn(`Warning: failed to parse golden snapshots (${err.message}) -- running without baseline`);

    return { snapshot: null, unavailableReason: null };
  }

  // A latest.json cut short by a failed deploy: the key fields are there, the scenarios are not.
  // Returned as-is it would be a truthy baseline with nothing in it, and the comment would carry raw
  // numbers with no baseline line at all.
  if (Object.keys(single.scenarios || {}).length === 0) {
    return { snapshot: null, unavailableReason: BASELINE_REFUSALS['empty-golden'] };
  }

  if (compatibleWith && !isCompatibleBaseline(single, compatibleWith.key)) {
    return {
      snapshot: null,
      unavailableReason: describeKeyMismatch(compatibleWith.key, baselineKey(single)),
    };
  }

  // Same browser and harness, but no scenario at a version this run measures: nothing in it can be
  // compared. A partial overlap is returned; the teardown withholds the mismatched scenarios one by
  // one, the way it does for a window mismatch.
  if (compatibleWith && !sharesAnyScenarioVersion(single, compatibleWith.scenarioVersions)) {
    return { snapshot: null, unavailableReason: SCENARIO_VERSIONS_MISMATCH_REASON };
  }

  return { snapshot: single, unavailableReason: null };
}

/**
 * The snapshot alone, or null. Kept for the existing tests and for any caller that predates
 * `loadBaseline`; new code calls `loadBaseline` and reads the refusal reason with the snapshot.
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
 * @param {object} snapshot
 * @param {Record<string, number> | undefined} scenarioVersions -- the current run's, per scenario
 * @returns {boolean} whether at least one scenario in the snapshot is at the version this run measures
 */
function sharesAnyScenarioVersion(snapshot, scenarioVersions) {
  if (!scenarioVersions) {
    return true;
  }

  const entries = Object.entries(snapshot.scenarios || {});
  const shared = entries.filter(([name]) => name in scenarioVersions);

  // Nothing in common by name: the run measured scenarios this golden does not know. That is the
  // "no baseline yet" case per scenario, not a version conflict, so the golden is returned.
  if (shared.length === 0) {
    return true;
  }

  return shared.some(([name, entry]) =>
    (entry?.measurementVersion ?? DEFAULT_MEASUREMENT_VERSION) === scenarioVersions[name]);
}

/**
 * @param {{ reason: string, example: object | null } | null} refusal -- from explainMedianRefusal
 * @param {{ key: object } | null} compatibleWith
 * @returns {string | null}
 */
function refusalText(refusal, compatibleWith) {
  if (!refusal) {
    return null;
  }

  if (refusal.reason === MEDIAN_REFUSAL.INCOMPATIBLE_KEY) {
    return refusal.example
      ? describeKeyMismatch(compatibleWith.key, baselineKey(refusal.example))
      : describeKeyMismatch(compatibleWith.key, { chromium: null, platform: null, harnessVersion: null });
  }

  return BASELINE_REFUSALS[refusal.reason] ?? null;
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
 * @returns {Promise<{ snapshot: object | null, refusal: { reason: string, example: object | null } | null }>}
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
        'Chromium build, platform, or harness version.'
      );
    }

    return { snapshot: median, refusal: null };
  }

  // The median module says why it refused; nothing is inferred from counts here.
  const refusal = explainMedianRefusal(snapshots, { windowSize, compatibleWith });
  const fallback = goldenPathExists
    ? 'falling back to latest.json if it is compatible'
    : 'no single-file golden either, running without baseline';

  console.warn(`Golden history yielded no median (${refusal?.reason ?? 'unknown'}) -- ${fallback}`);

  return { snapshot: null, refusal };
}
