// Unit tests for the rolling-median golden baseline.
//
// A PR's regression delta was computed against a single develop snapshot
// (latest.json), which every develop push overwrites -- so a fluke run could
// become the baseline for every later PR. computeMedianSnapshot() synthesizes
// a baseline from the last N *valid* develop snapshots instead. "Valid" means
// every scenario in the snapshot carries a marked trace window: snapshots
// recorded before that measurement fix have no `windowSource` field at all,
// which is what excludes them here without a manual cutoff date.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeMedianSnapshot, isValidForMedian, MEDIAN_WINDOW_SIZE } from '../median-snapshot.mjs';

const DEFAULT_UPDATE_COUNTERS = {
  sampleCount: 3,
  jsHeapMinBytes: 1_000_000,
  jsHeapMaxBytes: 2_000_000,
  documentsMin: 1,
  documentsMax: 1,
  nodesMin: 100,
  nodesMax: 110,
  listenersMin: 10,
  listenersMax: 12,
};

/**
 * @param {string} timestamp -- ISO string
 * @param {object} [overrides] -- per-scenario overrides, keyed by scenario name
 * @returns {object} a snapshot shaped like one saved by teardown.mjs
 */
function snapshot(timestamp, overrides = {}) {
  return {
    timestamp,
    scenarios: {
      sorting: {
        categories: { scripting: 80, rendering: 10, painting: 2 },
        rangeEnd: 100,
        total: 92,
        windowSource: 'marks',
        updateCounters: { ...DEFAULT_UPDATE_COUNTERS },
        ...overrides.sorting,
      },
      ...Object.fromEntries(Object.entries(overrides).filter(([name]) => name !== 'sorting')),
    },
  };
}

describe('isValidForMedian', () => {
  test('accepts a snapshot where every scenario is windowSource "marks"', () => {
    assert.equal(isValidForMedian(snapshot('2026-08-28T00:00:00Z')), true);
  });

  test('rejects a snapshot with even one scenario not "marks"', () => {
    const withBadScenario = snapshot('2026-08-28T00:00:00Z', {
      filtering: { categories: { scripting: 40 }, windowSource: 'auto-zoom' },
    });

    assert.equal(isValidForMedian(withBadScenario), false);
  });

  test('rejects a pre-measurement-fix snapshot (no windowSource field at all)', () => {
    const preFix = snapshot('2026-07-01T00:00:00Z');

    delete preFix.scenarios.sorting.windowSource;

    assert.equal(isValidForMedian(preFix), false);
  });

  test('rejects an empty snapshot', () => {
    assert.equal(isValidForMedian({ timestamp: '2026-08-28T00:00:00Z', scenarios: {} }), false);
  });
});

describe('computeMedianSnapshot', () => {
  test('returns null when nothing qualifies', () => {
    const preFix = snapshot('2026-07-01T00:00:00Z');

    delete preFix.scenarios.sorting.windowSource;

    assert.equal(computeMedianSnapshot([preFix]), null);
  });

  test('medians an odd number of values to the middle one', () => {
    const snapshots = [10, 20, 30].map((scripting, i) =>
      snapshot(`2026-08-2${i}T00:00:00Z`, { sorting: { categories: { scripting } } }));

    const result = computeMedianSnapshot(snapshots);

    assert.equal(result.scenarios.sorting.categories.scripting, 20);
  });

  test('medians an even number of values to the mean of the middle two', () => {
    const snapshots = [10, 20, 30, 40].map((scripting, i) =>
      snapshot(`2026-08-2${i}T00:00:00Z`, { sorting: { categories: { scripting } } }));

    const result = computeMedianSnapshot(snapshots);

    assert.equal(result.scenarios.sorting.categories.scripting, 25);
  });

  test('rounds the integer updateCounters fields but not the byte counts', () => {
    const snapshots = [
      { sampleCount: 3, jsHeapMinBytes: 1_000_001, jsHeapMaxBytes: 2_000_001 },
      { sampleCount: 4, jsHeapMinBytes: 1_000_003, jsHeapMaxBytes: 2_000_003 },
    ].map((updateCounters, i) => snapshot(`2026-08-2${i}T00:00:00Z`, {
      sorting: { updateCounters: { ...DEFAULT_UPDATE_COUNTERS, ...updateCounters } },
    }));

    const result = computeMedianSnapshot(snapshots);

    // Median of 3 and 4 is 3.5 -- must round for a field a person reads as a count.
    assert.equal(result.scenarios.sorting.updateCounters.sampleCount, 4);
    // Byte counts stay exact, matching the existing per-iteration averaging behavior.
    assert.equal(result.scenarios.sorting.updateCounters.jsHeapMinBytes, 1_000_002);
    assert.equal(result.scenarios.sorting.updateCounters.jsHeapMaxBytes, 2_000_002);
  });

  test('regenerates the heap labels from the medianed bytes', () => {
    const result = computeMedianSnapshot([snapshot('2026-08-28T00:00:00Z')]);

    assert.equal(result.scenarios.sorting.updateCounters.jsHeapMinLabel, '1000 kB');
    assert.equal(result.scenarios.sorting.updateCounters.jsHeapMaxLabel, '2.0 MB');
  });

  test('uses only the newest MEDIAN_WINDOW_SIZE of more snapshots than that', () => {
    const timestamps = Array.from({ length: MEDIAN_WINDOW_SIZE + 3 }, (_, i) =>
      `2026-08-${String(10 + i).padStart(2, '0')}T00:00:00Z`);
    const snapshots = timestamps.map(ts => snapshot(ts));

    const result = computeMedianSnapshot(snapshots);

    assert.equal(result.medianWindowSize, MEDIAN_WINDOW_SIZE);
    assert.deepEqual(
      result.medianSourceTimestamps,
      [...timestamps].sort().reverse().slice(0, MEDIAN_WINDOW_SIZE)
    );
  });

  test('every synthesized scenario is explicitly windowSource "marks"', () => {
    // Guards against a regression that would leave this field unset: teardown.mjs's
    // windowSourceOf() treats a missing field as 'auto-zoom', which would make the
    // median baseline read as cross-window-mismatched against every real PR run.
    const result = computeMedianSnapshot([snapshot('2026-08-28T00:00:00Z')]);

    assert.equal(result.scenarios.sorting.windowSource, 'marks');
  });

  test('includes hookTiming only when present on at least one input', () => {
    const withHook = snapshot('2026-08-28T00:00:00Z', { sorting: { hookTiming: 50 } });
    const withoutHook = snapshot('2026-08-29T00:00:00Z');

    const result = computeMedianSnapshot([withHook, withoutHook]);

    assert.equal(result.scenarios.sorting.hookTiming, 50);

    const noneWithHook = computeMedianSnapshot([snapshot('2026-08-28T00:00:00Z')]);

    assert.equal('hookTiming' in noneWithHook.scenarios.sorting, false);
  });
});
