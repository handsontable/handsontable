// Unit tests for the rolling-median golden baseline.
//
// A PR's regression delta was computed against a single develop snapshot
// (latest.json), which every develop push overwrites -- so a fluke run could
// become the baseline for every later PR. computeMedianSnapshot() synthesizes
// a baseline from the last N *valid* develop snapshots instead. "Valid" means
// a parseable timestamp and every scenario in the snapshot carrying a marked
// trace window: snapshots recorded before that measurement fix have no
// `windowSource` field at all, which is what excludes them here without a
// manual cutoff date. Below MIN_VALID_SNAPSHOTS, computeMedianSnapshot()
// returns null rather than silently reporting a "median" of one run --
// itself the single-fluke-baseline problem this module exists to fix.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMedianSnapshot,
  isValidForMedian,
  MEDIAN_WINDOW_SIZE,
  MIN_VALID_SNAPSHOTS,
} from '../median-snapshot.mjs';

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

  test('rejects a scenario value that is not an object, instead of throwing', () => {
    const malformed = snapshot('2026-08-28T00:00:00Z', { filtering: null });

    assert.doesNotThrow(() => isValidForMedian(malformed));
    assert.equal(isValidForMedian(malformed), false);
  });

  test('rejects a snapshot with a missing or unparseable timestamp', () => {
    assert.equal(isValidForMedian(snapshot(undefined)), false);
    assert.equal(isValidForMedian(snapshot('not-a-date')), false);
  });
});

describe('computeMedianSnapshot', () => {
  test('returns null when nothing qualifies', () => {
    const preFix = snapshot('2026-07-01T00:00:00Z');

    delete preFix.scenarios.sorting.windowSource;

    assert.equal(computeMedianSnapshot([preFix]), null);
  });

  test('returns null (not a "median of 1") below MIN_VALID_SNAPSHOTS', () => {
    // A one-run "median" is exactly the single-fluke-baseline problem this module
    // exists to fix, just relabeled -- so it must not report isMedian: true.
    assert.equal(MIN_VALID_SNAPSHOTS, 2, 'test assumes the floor is 2; update the fixtures below if this changes');
    assert.equal(computeMedianSnapshot([snapshot('2026-08-28T00:00:00Z')]), null);
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
    const result = computeMedianSnapshot([
      snapshot('2026-08-28T00:00:00Z'),
      snapshot('2026-08-29T00:00:00Z'),
    ]);

    assert.equal(result.scenarios.sorting.updateCounters.jsHeapMinLabel, '1000 kB');
    assert.equal(result.scenarios.sorting.updateCounters.jsHeapMaxLabel, '2.0 MB');
  });

  test('medians rangeStart and runs alongside the other scalar fields', () => {
    const snapshots = [10, 20].map((runs, i) => snapshot(`2026-08-2${i}T00:00:00Z`, {
      sorting: { rangeStart: 0, runs },
    }));

    const result = computeMedianSnapshot(snapshots);

    assert.equal(result.scenarios.sorting.rangeStart, 0);
    assert.equal(result.scenarios.sorting.runs, 15);
  });

  test('rounds rangeEnd and total, matching how a real snapshot saves them', () => {
    // A real snapshot always has integer rangeEnd/total (averageParsedTraces rounds
    // them). An even window's median would otherwise land on a .5, a shape no real
    // saved snapshot could ever have.
    const snapshots = [100, 101].map((rangeEnd, i) => snapshot(`2026-08-2${i}T00:00:00Z`, {
      sorting: { rangeEnd, total: rangeEnd },
    }));

    const result = computeMedianSnapshot(snapshots);

    assert.equal(result.scenarios.sorting.rangeEnd, 101);
    assert.equal(result.scenarios.sorting.total, 101);
    assert.equal(Number.isInteger(result.scenarios.sorting.rangeEnd), true);
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

  test('omits a scenario present in fewer than MIN_VALID_SNAPSHOTS of the windowed snapshots', () => {
    // A scenario just added to the suite might exist in only 1 of the last 5 develop
    // snapshots. Medianing that single entry would reproduce the single-fluke-baseline
    // problem this module exists to fix, silently, for just that one scenario.
    const filteringOnce = { categories: { scripting: 40 }, windowSource: 'marks' };
    const snapshots = [
      snapshot('2026-08-27T00:00:00Z'),
      snapshot('2026-08-28T00:00:00Z', { filtering: filteringOnce }),
      snapshot('2026-08-29T00:00:00Z'),
    ];

    const result = computeMedianSnapshot(snapshots);

    assert.equal('filtering' in result.scenarios, false);
    // The rest of the snapshot is unaffected -- only the underrepresented scenario is dropped.
    assert.equal('sorting' in result.scenarios, true);
  });

  test('keeps a scenario present in exactly MIN_VALID_SNAPSHOTS of the windowed snapshots', () => {
    const filteringTwice = { categories: { scripting: 40 }, windowSource: 'marks' };
    const snapshots = [
      snapshot('2026-08-27T00:00:00Z', { filtering: filteringTwice }),
      snapshot('2026-08-28T00:00:00Z', { filtering: filteringTwice }),
      snapshot('2026-08-29T00:00:00Z'),
    ];

    const result = computeMedianSnapshot(snapshots);

    assert.equal(result.scenarios.filtering.categories.scripting, 40);
  });

  test('every synthesized scenario is explicitly windowSource "marks"', () => {
    // Guards against a regression that would leave this field unset: teardown.mjs's
    // windowSourceOf() treats a missing field as 'auto-zoom', which would make the
    // median baseline read as cross-window-mismatched against every real PR run.
    const result = computeMedianSnapshot([
      snapshot('2026-08-28T00:00:00Z'),
      snapshot('2026-08-29T00:00:00Z'),
    ]);

    assert.equal(result.scenarios.sorting.windowSource, 'marks');
  });

  test('includes hookTiming only when present on at least one input', () => {
    const withHook = snapshot('2026-08-28T00:00:00Z', { sorting: { hookTiming: 50 } });
    const withoutHook = snapshot('2026-08-29T00:00:00Z');

    const result = computeMedianSnapshot([withHook, withoutHook]);

    assert.equal(result.scenarios.sorting.hookTiming, 50);

    const noneWithHook = computeMedianSnapshot([
      snapshot('2026-08-28T00:00:00Z'),
      snapshot('2026-08-29T00:00:00Z'),
    ]);

    assert.equal('hookTiming' in noneWithHook.scenarios.sorting, false);
  });

  test('records how far apart the windowed runs sit, as a CV of their active time', () => {
    // The per-iteration values are stripped before a golden is saved, so this is the only spread
    // the baseline side can ever report -- and it is the one that matters, because it measures the
    // run-to-run variance a PR's single run is being compared against.
    const result = computeMedianSnapshot([
      snapshot('2026-08-28T00:00:00Z', {
        sorting: { categories: { scripting: 90, rendering: 10, painting: 0 } },
      }),
      snapshot('2026-08-29T00:00:00Z', {
        sorting: { categories: { scripting: 100, rendering: 0, painting: 0 } },
      }),
      snapshot('2026-08-30T00:00:00Z', {
        sorting: { categories: { scripting: 110, rendering: 0, painting: 0 } },
      }),
    ]);

    // Active totals 100 / 100 / 110. Mean 103.33, sample stddev sqrt(66.67/2) = 5.7735,
    // so the CV is 5.59%.
    assert.ok(result.scenarios.sorting.spread > 0);
    assert.equal(result.scenarios.sorting.spread.toFixed(2), '5.59');
  });

  test('reports a zero spread when every windowed run measured the same active time', () => {
    const result = computeMedianSnapshot([
      snapshot('2026-08-28T00:00:00Z'),
      snapshot('2026-08-29T00:00:00Z'),
    ]);

    assert.equal(result.scenarios.sorting.spread, 0);
  });
});
