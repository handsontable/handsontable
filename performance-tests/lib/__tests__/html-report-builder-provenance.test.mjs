// Unit tests for the provenance the HTML report carries in its payload: the run shift, the
// environment, the baseline's browser and the reason a baseline was refused, and the per-scenario
// heap threshold. Each is read by the client script, so what matters is that it reaches the
// serialized payload and that it agrees with the markdown comment built from the same inputs.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildHtmlReport } from '../html-report-builder.mjs';
import { buildReport } from '../report-builder.mjs';
import { REGRESSION_CALLOUT_THRESHOLD_HEAP, heapThresholdFor } from '../thresholds.mjs';

/**
 * @param {string} html
 * @returns {object} the payload the client script reads
 */
function payloadOf(html) {
  return JSON.parse(html.match(/window\.__PERF_DATA__ = ([\s\S]*?);\n<\/script>/)[1]);
}

/**
 * @param {number} scripting
 * @param {object} [overrides]
 * @returns {object}
 */
function current(scripting, overrides = {}) {
  return {
    categories: { scripting, rendering: 3, painting: 1 },
    updateCounters: { jsHeapMaxBytes: 100_000_000, jsHeapMaxLabel: '100 MB' },
    rangeEnd: 90,
    runs: 3,
    windowSource: 'marks',
    _iterationValues: {
      categories: { scripting: [scripting, scripting, scripting], rendering: [3, 3, 3], painting: [1, 1, 1] },
      rangeEnd: [90, 90, 90],
    },
    ...overrides,
  };
}

/**
 * @param {object} [overrides]
 * @returns {object}
 */
function golden(overrides = {}) {
  return {
    categories: { scripting: 100, rendering: 3, painting: 1 },
    updateCounters: { jsHeapMaxBytes: 100_000_000, jsHeapMaxLabel: '100 MB' },
    rangeEnd: 90,
    windowSource: 'marks',
    spread: 12,
    ...overrides,
  };
}

const NAMES = ['a', 'b', 'c', 'd', 'e', 'f'];

/**
 * @param {number} factor
 * @param {Record<string, number>} [extra]
 * @returns {{ results: object, snapshot: object }}
 */
function run(factor, extra = {}) {
  const results = {};
  const scenarios = {};

  for (const name of NAMES) {
    const m = factor * (extra[name] ?? 1);

    results[name] = current(100 * m, { categories: { scripting: 100 * m, rendering: 3 * m, painting: m } });
    scenarios[name] = golden();
  }

  return {
    results,
    snapshot: {
      timestamp: '2026-09-04T08:00:00.000Z',
      isMedian: true,
      medianWindowSize: 5,
      medianSourceTimestamps: ['2026-09-04T08:00:00.000Z'],
      environment: { chromium: '140.0.7339.16' },
      scenarios,
    },
  };
}

describe('buildHtmlReport -- run shift', () => {
  test('serializes the shift and each scenario relative to it', () => {
    const { results, snapshot } = run(0.8, { c: 1.8 });
    const data = payloadOf(buildHtmlReport(results, snapshot, {}));

    assert.ok(Math.abs(data.runShift - -20) < 1e-9);

    const flat = data.scenarios.find(s => s.name === 'a');
    const moved = data.scenarios.find(s => s.name === 'c');

    assert.ok(Math.abs(flat.totalChangeVsShift) < 1e-9);
    assert.ok(Math.abs(moved.totalChange - 44) < 1e-9);
    assert.ok(Math.abs(moved.totalChangeVsShift - 80) < 1e-9);
    assert.equal(moved.status, 'regression', 'the badge still follows the raw delta');
  });

  test('is null on a self-comparison and with too few rows', () => {
    const { results, snapshot } = run(0.8);

    assert.equal(payloadOf(buildHtmlReport(results, { ...snapshot, isSelfCompare: true }, {})).runShift, null);

    const few = payloadOf(buildHtmlReport(
      { a: results.a, b: results.b },
      { ...snapshot, scenarios: { a: snapshot.scenarios.a, b: snapshot.scenarios.b } },
      {}
    ));

    assert.equal(few.runShift, null);
    assert.equal(few.scenarios[0].totalChangeVsShift, null);
  });

});

describe('buildHtmlReport -- environment and refusal', () => {
  test('carries the run environment, pre-rendered, and the baseline browser', () => {
    const { results, snapshot } = run(1);
    const data = payloadOf(buildHtmlReport(results, snapshot, {
      environment: { chromium: '140.0.7339.16', cpuModel: 'Apple M1', cpuCount: 8, runnerImage: null },
    }));

    assert.equal(data.meta.environment, 'Chromium 140.0.7339.16 · Apple M1 ×8');
    assert.equal(data.baseline.chromium, '140.0.7339.16');
    assert.equal(data.baseline.unavailableReason, null);
  });

  test('a self-comparison carries the refusal reason, and only then', () => {
    const { results, snapshot } = run(1);
    const reason = 'the develop goldens were recorded on a different environment (Chromium 138 -> 140)';
    const refused = payloadOf(buildHtmlReport(
      results, { ...snapshot, isSelfCompare: true }, { baselineUnavailable: reason }
    ));
    const real = payloadOf(buildHtmlReport(results, snapshot, { baselineUnavailable: reason }));

    assert.equal(refused.baseline.unavailableReason, reason);
    assert.equal(real.baseline.unavailableReason, null, 'a real baseline was found, so no refusal is claimed');
  });

  test('an unknown environment is null rather than an empty string', () => {
    const { results, snapshot } = run(1);

    assert.equal(payloadOf(buildHtmlReport(results, snapshot, {})).meta.environment, null);
  });

  test('with no baseline at all, the refusal reason still reaches the payload', () => {
    // A golden (develop-push) run after a Chromium change: no self-comparison is synthesized there.
    const { results } = run(1);
    const reason = 'the develop goldens were recorded on a different environment (Chromium 138 -> 140)';
    const data = payloadOf(buildHtmlReport(results, null, { baselineUnavailable: reason }));

    assert.equal(data.baseline, null);
    assert.equal(data.hasBaseline, false);
    assert.equal(data.meta.baselineUnavailable, reason);
  });
});

describe('buildHtmlReport -- per-scenario heap threshold', () => {
  test('each scenario carries its own heap threshold and is gated on it', () => {
    const between = (heapThresholdFor('scroll-left') + REGRESSION_CALLOUT_THRESHOLD_HEAP) / 2;
    const heap = { updateCounters: { jsHeapMaxBytes: 100_000_000 * (1 + between / 100), jsHeapMaxLabel: 'x' } };
    const data = payloadOf(buildHtmlReport(
      { 'scroll-left': current(100, heap), sorting: current(100, heap) },
      { timestamp: 't', scenarios: { 'scroll-left': golden(), sorting: golden() } },
      {}
    ));
    const scrollLeft = data.scenarios.find(s => s.name === 'scroll-left');
    const sorting = data.scenarios.find(s => s.name === 'sorting');

    assert.equal(scrollLeft.heapThreshold, heapThresholdFor('scroll-left'));
    assert.equal(sorting.heapThreshold, REGRESSION_CALLOUT_THRESHOLD_HEAP);
    assert.equal(scrollLeft.isRegression, false);
    assert.equal(sorting.isRegression, true);
    assert.equal(data.summary.regressions, 1);
  });

  test('agrees with the markdown comment on the same inputs', () => {
    const between = (heapThresholdFor('scroll-right') + REGRESSION_CALLOUT_THRESHOLD_HEAP) / 2;
    const heap = { updateCounters: { jsHeapMaxBytes: 100_000_000 * (1 + between / 100), jsHeapMaxLabel: 'x' } };
    const results = { 'scroll-right': current(100, heap) };
    const snapshot = { timestamp: 't', scenarios: { 'scroll-right': golden() } };

    assert.equal(payloadOf(buildHtmlReport(results, snapshot, {})).summary.regressions, 0);
    assert.ok(!buildReport(results, snapshot, {}).includes('regressed'));
  });
});
