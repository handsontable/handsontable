// Synthesizes a single "median" golden snapshot from a set of develop golden
// snapshots, so a PR is compared against recent trend instead of one run.

import { formatHeapMinBytesLabel, formatHeapMaxBytesLabel } from '../trace-parser.mjs';
import { calcCv, sumActive } from './thresholds.mjs';
import { DEFAULT_MEASUREMENT_VERSION, isCompatibleBaseline } from './environment.mjs';

// How many of the newest marks-valid develop snapshots to median over. Small
// enough that a real regression introduced mid-window isn't diluted by twice
// as much older history, large enough to smooth out one flaky CI run.
export const MEDIAN_WINDOW_SIZE = 5;

// Below this many valid snapshots, a "median" is no more robust than the single-run
// baseline this module exists to replace -- so computeMedianSnapshot() refuses to
// produce one, and the caller falls back to the plain (honestly-labeled) single
// snapshot instead of a median that silently degenerates to one fluke run.
export const MIN_VALID_SNAPSHOTS = 2;

/**
 * @param {Array<number | null | undefined>} values
 * @returns {number | null}
 */
function median(values) {
  const nums = (values || []).filter(v => typeof v === 'number' && Number.isFinite(v));

  if (nums.length === 0) {
    return null;
  }

  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * @param {Array<number | null | undefined>} values
 * @returns {number | null}
 */
function medianRounded(values) {
  const m = median(values);

  return m === null ? null : Math.round(m);
}

/**
 * A snapshot only qualifies for the median if its timestamp is usable for sorting
 * and every scenario in it carries a marked trace window. Pre-PR1 snapshots have no
 * `windowSource` field on any scenario at all, so the mere absence of the field
 * already excludes them -- no cutoff date or migration step is needed. A scenario
 * value that isn't an object (a shape-malformed but JSON-valid history file) is
 * rejected rather than crashing on `.windowSource`.
 *
 * @param {object} snapshot
 * @returns {boolean}
 */
export function isValidForMedian(snapshot) {
  if (!Number.isFinite(Date.parse(snapshot?.timestamp))) {
    return false;
  }

  const scenarios = snapshot?.scenarios;

  if (!scenarios || Object.keys(scenarios).length === 0) {
    return false;
  }

  return Object.values(scenarios).every(
    scenario => scenario !== null && typeof scenario === 'object' && scenario.windowSource === 'marks'
  );
}

/**
 * @param {Array<object>} entries -- per-scenario objects from qualifying snapshots
 * @returns {object}
 */
function medianScenario(entries) {
  const categoryKeys = new Set();

  entries.forEach(entry => Object.keys(entry.categories || {}).forEach(key => categoryKeys.add(key)));

  const categories = {};

  for (const key of categoryKeys) {
    categories[key] = median(entries.map(entry => entry.categories?.[key]));
  }

  const updateCounterEntries = entries.map(entry => entry.updateCounters).filter(Boolean);
  let updateCounters = null;

  if (updateCounterEntries.length > 0) {
    const jsHeapMinBytes = median(updateCounterEntries.map(uc => uc.jsHeapMinBytes));
    const jsHeapMaxBytes = median(updateCounterEntries.map(uc => uc.jsHeapMaxBytes));
    // Absent on goldens recorded before the runner read the live heap; median() skips those, so a
    // window mixing old and new entries medians only the ones that have it.
    const jsHeapAfterGcBytes = median(updateCounterEntries.map(uc => uc.jsHeapAfterGcBytes));

    updateCounters = {
      sampleCount: medianRounded(updateCounterEntries.map(uc => uc.sampleCount)) ?? 0,
      jsHeapMinBytes,
      jsHeapMaxBytes,
      jsHeapMinLabel: jsHeapMinBytes === null ? null : formatHeapMinBytesLabel(jsHeapMinBytes),
      jsHeapMaxLabel: jsHeapMaxBytes === null ? null : formatHeapMaxBytesLabel(jsHeapMaxBytes),
      ...(jsHeapAfterGcBytes === null ? {} : {
        jsHeapAfterGcBytes,
        jsHeapAfterGcLabel: formatHeapMaxBytesLabel(jsHeapAfterGcBytes),
      }),
      documentsMin: medianRounded(updateCounterEntries.map(uc => uc.documentsMin)),
      documentsMax: medianRounded(updateCounterEntries.map(uc => uc.documentsMax)),
      nodesMin: medianRounded(updateCounterEntries.map(uc => uc.nodesMin)),
      nodesMax: medianRounded(updateCounterEntries.map(uc => uc.nodesMax)),
      listenersMin: medianRounded(updateCounterEntries.map(uc => uc.listenersMin)),
      listenersMax: medianRounded(updateCounterEntries.map(uc => uc.listenersMax)),
    };
  }

  const hookTimingValues = entries.map(entry => entry.hookTiming).filter(v => v !== undefined && v !== null);

  return {
    // When computeMedianSnapshot was given a key it filtered the entries to one version, so the
    // first one's is the median's. Without a key (the replay's no-provenance group) the entries
    // may mix versions and this is only the newest entry's; no consumer reads it off a median today.
    measurementVersion: entries[0].measurementVersion ?? DEFAULT_MEASUREMENT_VERSION,
    categories,
    // Rounded, like averageParsedTraces (trace-parser.mjs) rounds these on a real
    // snapshot -- an even window would otherwise produce e.g. rangeEnd: 92.5, a shape
    // no real run could ever save.
    rangeStart: medianRounded(entries.map(entry => entry.rangeStart)),
    rangeEnd: medianRounded(entries.map(entry => entry.rangeEnd)),
    total: medianRounded(entries.map(entry => entry.total)),
    runs: medianRounded(entries.map(entry => entry.runs)),
    updateCounters,
    // Set explicitly, never left to default. teardown.mjs's windowSourceOf()
    // treats a missing field as 'auto-zoom' -- an unset value here would make
    // every scenario read as cross-window-mismatched on every PR.
    windowSource: 'marks',
    // How far apart the runs behind this median sit, as a CV of their active time. The
    // per-iteration values are stripped before a golden is saved, so this is the only
    // spread the baseline side can report -- and it is the more useful one: it measures
    // run-to-run variance (11-19% per scenario), where the current run's own intra-run
    // CV measures only how stable three back-to-back iterations were (0.9-4%).
    spread: calcCv(entries.map(entry => sumActive(entry.categories || {}))),
    ...(hookTimingValues.length > 0 ? { hookTiming: median(hookTimingValues) } : {}),
  };
}

/**
 * @param {Array<object>} snapshots -- already-parsed golden snapshot JSON objects, any order
 * @param {object} [options]
 * @param {number} [options.windowSize]
 * @param {{ key: { chromium: string | null, harnessVersion: number | null },
 *   scenarioVersions?: Record<string, number> } | null} [options.compatibleWith] -- the run the
 *   median is a baseline for. When given, only goldens with the same compatibility key (Chromium
 *   build and harness version, see lib/environment.mjs) enter the window, and within a scenario only
 *   entries with the same `measurementVersion` as the current run's (`scenarioVersions`, per
 *   scenario name; a scenario absent there is taken at the default). Omit it to median over
 *   everything marks-valid, which is what the replay does for goldens without provenance.
 * @returns {object | null} a snapshot-shaped object, or null if nothing qualifies
 */
export function computeMedianSnapshot(
  snapshots, { windowSize = MEDIAN_WINDOW_SIZE, compatibleWith = null } = {}
) {
  const marksValid = (snapshots || []).filter(isValidForMedian);
  const compatible = compatibleWith
    ? marksValid.filter(snapshot => isCompatibleBaseline(snapshot, compatibleWith.key))
    : marksValid;
  const valid = compatible
    // isValidForMedian already rejected anything with an unparseable timestamp, so
    // this subtraction is never NaN here.
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, windowSize);

  if (valid.length < MIN_VALID_SNAPSHOTS) {
    return null;
  }

  const scenarioNames = new Set();

  valid.forEach(snapshot => Object.keys(snapshot.scenarios).forEach(name => scenarioNames.add(name)));

  const scenarios = {};

  for (const name of scenarioNames) {
    const wanted = compatibleWith?.scenarioVersions?.[name] ?? DEFAULT_MEASUREMENT_VERSION;
    const entries = valid
      .map(snapshot => snapshot.scenarios[name])
      .filter(Boolean)
      // A scenario redefined since a golden was recorded (its spec moved work in or out of the
      // window) measures a different quantity under the same name. Its old entries are dropped
      // here; the snapshot they came from still serves the scenarios that did not change.
      .filter(entry => !compatibleWith
        || (entry.measurementVersion ?? DEFAULT_MEASUREMENT_VERSION) === wanted);

    // A scenario present in only a few of the windowed snapshots (e.g. one just added)
    // would otherwise get a "median" computed from fewer than MIN_VALID_SNAPSHOTS
    // entries -- the single-fluke-baseline problem this module exists to fix,
    // reproduced silently per scenario under the same isMedian: true the rest of the
    // snapshot reports. Omit it instead; the comparison for that scenario then falls
    // through to "no baseline" the same way a brand-new scenario already does.
    if (entries.length < MIN_VALID_SNAPSHOTS) {
      continue;
    }

    scenarios[name] = medianScenario(entries);
  }

  // Every scenario dropped by the per-scenario version filter (each one redefined since the
  // windowed goldens were recorded). A median with no scenarios is not a baseline, and returning
  // one would let the loader report a baseline was found and the reports render raw numbers with
  // no reason -- the silent case this module's key exists to prevent.
  if (Object.keys(scenarios).length === 0) {
    return null;
  }

  return {
    timestamp: valid[0].timestamp,
    isMedian: true,
    medianWindowSize: valid.length,
    medianSourceTimestamps: valid.map(snapshot => snapshot.timestamp),
    // The newest golden's, which every other one in the window shares when a key was required.
    // Carried so the footer can state what environment the baseline was recorded on.
    environment: valid[0].environment ?? null,
    harnessVersion: valid[0].harnessVersion ?? null,
    // How many marks-valid goldens were passed over for a different key. Zero when no key was
    // asked for. Lets the teardown say "20 goldens fetched, 18 on another Chromium".
    excludedIncompatible: marksValid.length - compatible.length,
    scenarios,
  };
}
