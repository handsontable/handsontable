// Synthesizes a single "median" golden snapshot from a set of develop golden
// snapshots, so a PR is compared against recent trend instead of one run.

import { formatHeapMinBytesLabel, formatHeapMaxBytesLabel } from '../trace-parser.mjs';

// How many of the newest marks-valid develop snapshots to median over. Small
// enough that a real regression introduced mid-window isn't diluted by twice
// as much older history, large enough to smooth out one flaky CI run.
export const MEDIAN_WINDOW_SIZE = 5;

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
 * A snapshot only qualifies for the median if every scenario in it carries a
 * marked trace window. Pre-PR1 snapshots have no `windowSource` field on any
 * scenario at all, so the mere absence of the field already excludes them --
 * no cutoff date or migration step is needed.
 *
 * @param {object} snapshot
 * @returns {boolean}
 */
export function isValidForMedian(snapshot) {
  const scenarios = snapshot?.scenarios;

  if (!scenarios || Object.keys(scenarios).length === 0) {
    return false;
  }

  return Object.values(scenarios).every(scenario => scenario.windowSource === 'marks');
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

    updateCounters = {
      sampleCount: medianRounded(updateCounterEntries.map(uc => uc.sampleCount)) ?? 0,
      jsHeapMinBytes,
      jsHeapMaxBytes,
      jsHeapMinLabel: jsHeapMinBytes === null ? null : formatHeapMinBytesLabel(jsHeapMinBytes),
      jsHeapMaxLabel: jsHeapMaxBytes === null ? null : formatHeapMaxBytesLabel(jsHeapMaxBytes),
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
    categories,
    rangeEnd: median(entries.map(entry => entry.rangeEnd)),
    total: median(entries.map(entry => entry.total)),
    updateCounters,
    // Set explicitly, never left to default. teardown.mjs's windowSourceOf()
    // treats a missing field as 'auto-zoom' -- an unset value here would make
    // every scenario read as cross-window-mismatched on every PR.
    windowSource: 'marks',
    ...(hookTimingValues.length > 0 ? { hookTiming: median(hookTimingValues) } : {}),
  };
}

/**
 * @param {Array<object>} snapshots -- already-parsed golden snapshot JSON objects, any order
 * @param {object} [options]
 * @param {number} [options.windowSize]
 * @returns {object | null} a snapshot-shaped object, or null if nothing qualifies
 */
export function computeMedianSnapshot(snapshots, { windowSize = MEDIAN_WINDOW_SIZE } = {}) {
  const valid = (snapshots || [])
    .filter(isValidForMedian)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, windowSize);

  if (valid.length === 0) {
    return null;
  }

  const scenarioNames = new Set();

  valid.forEach(snapshot => Object.keys(snapshot.scenarios).forEach(name => scenarioNames.add(name)));

  const scenarios = {};

  for (const name of scenarioNames) {
    scenarios[name] = medianScenario(valid.map(snapshot => snapshot.scenarios[name]).filter(Boolean));
  }

  return {
    timestamp: valid[0].timestamp,
    isMedian: true,
    medianWindowSize: valid.length,
    medianSourceTimestamps: valid.map(snapshot => snapshot.timestamp),
    scenarios,
  };
}
