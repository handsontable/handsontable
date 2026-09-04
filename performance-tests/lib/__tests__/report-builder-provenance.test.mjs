// Unit tests for what the markdown comment says about the run itself: the common shift against the
// baseline, the environment both sides ran on, why a baseline was refused, and the per-scenario
// heap band.
//
// The defects these guard, from the 2026-09-04 replay of 42 develop goldens: a whole table reading
// -25% green because the runner was a fast one (the shift), a Playwright bump turning into five days
// of red callouts because no report named the browser (the environment and the refusal), and the
// horizontal-scroll scenarios firing heap callouts on GC timing (the per-scenario band).

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, collectRegressions } from '../report-builder.mjs';
import {
  REGRESSION_CALLOUT_THRESHOLD_HEAP,
  REGRESSION_CALLOUT_THRESHOLD_TIMING,
  heapThresholdFor,
} from '../thresholds.mjs';

/**
 * @param {number} scripting
 * @param {object} [overrides]
 * @returns {object} a current-run scenario result
 */
function current(scripting, overrides = {}) {
  return {
    categories: { scripting, rendering: 3, painting: 1 },
    updateCounters: { jsHeapMaxBytes: 100_000_000, jsHeapMaxLabel: '100 MB' },
    rangeEnd: 90,
    runs: 3,
    windowSource: 'marks',
    _iterationValues: {
      categories: {
        scripting: [scripting - 1, scripting, scripting + 1], rendering: [3, 3, 3], painting: [1, 1, 1],
      },
      rangeEnd: [89, 90, 91],
    },
    ...overrides,
  };
}

/**
 * @param {number} scripting
 * @param {object} [overrides]
 * @returns {object} a golden scenario entry
 */
function golden(scripting, overrides = {}) {
  return {
    categories: { scripting, rendering: 3, painting: 1 },
    updateCounters: { jsHeapMaxBytes: 100_000_000, jsHeapMaxLabel: '100 MB' },
    rangeEnd: 90,
    windowSource: 'marks',
    spread: 12,
    ...overrides,
  };
}

const NAMES = [
  'scroll-down', 'scroll-up', 'scroll-right', 'scroll-left', 'filtering', 'sorting', 'cell-editing',
  'initial-load', 'source-data-validator-load',
];

/**
 * Nine scenarios, every one at the same baseline, the current run scaled by a common factor and
 * then per-scenario multipliers -- the shape a fast or slow runner produces.
 *
 * @param {number} factor -- e.g. 0.8 for a runner 20% faster than the baseline's
 * @param {Record<string, number>} [extra] -- per-scenario extra multipliers on top of the factor
 * @returns {{ results: object, snapshot: object }}
 */
function run(factor, extra = {}) {
  const results = {};
  const scenarios = {};

  for (const name of NAMES) {
    // Baseline active total is 100 + 3 + 1 = 104 with scripting 100; scale scripting so the total
    // scales by exactly the factor (rendering and painting are scaled too).
    const m = factor * (extra[name] ?? 1);

    results[name] = current(100 * m, {
      categories: { scripting: 100 * m, rendering: 3 * m, painting: 1 * m },
    });
    scenarios[name] = golden(100);
  }

  return {
    results,
    snapshot: {
      timestamp: '2026-09-04T08:00:00.000Z',
      isMedian: true,
      medianWindowSize: 5,
      medianSourceTimestamps: ['2026-09-04T08:00:00.000Z', '2026-09-03T08:00:00.000Z'],
      environment: { chromium: '140.0.7339.16' },
      scenarios,
    },
  };
}

describe('buildReport -- run shift', () => {
  test('names the common shift and shows each row relative to it', () => {
    // A runner 20% faster than the baseline's: every row reads -20%. That is PR 13371's table.
    const { results, snapshot } = run(0.8);
    const report = buildReport(results, snapshot, {});

    assert.ok(report.includes('Δ vs shift'), 'the column exists');
    assert.ok(report.includes('Run shift: -20.0%'), 'the footer names it');
    // Every row is at the shift, so relative to it every row is flat.
    const rows = report.split('\n').filter(line => line.startsWith('| Scroll Down'));

    assert.equal(rows.length, 1);
    assert.match(rows[0], /-20\.0% 🟢 \| \+0\.0% /, 'raw -20% green, +0.0% vs shift');
  });

  test('a row that moved on its own stands out from the shift, and the callout says so', () => {
    // Fast runner, and filtering genuinely 1.8x slower: raw +44%, relative to the -20% shift +80%.
    const { results, snapshot } = run(0.8, { filtering: 1.8 });
    const report = buildReport(results, snapshot, {});

    assert.ok(report.includes('Run shift: -20.0%'));
    assert.match(report, /\| Filtering .*\+44\.0% 🔴 \| \+80\.0% /);
    assert.ok(report.includes('**Filtering** regressed +44.0%'), 'the callout fires on the raw delta');
    assert.ok(report.includes('+80.0% relative to this run\'s shift of -20.0%'));
  });

  test('the callout still fires on the raw delta when the shift explains it', () => {
    // A slow runner, +20% everywhere. The gate is on the raw delta on purpose (a change that slows
    // every scenario alike looks exactly like this), so nine callouts fire and each says the row sits
    // at +0.0% relative to the shift -- the reader is told, not overruled.
    const { results, snapshot } = run(1.2);
    const report = buildReport(results, snapshot, {});

    assert.ok(report.includes('### Regressions'));
    assert.ok(report.includes('+0.0% relative to this run\'s shift of +20.0%'));
  });

  test('is not estimated on a self-comparison or from too few comparable rows', () => {
    const { results, snapshot } = run(0.8);
    const selfCompare = buildReport(results, { ...snapshot, isSelfCompare: true }, {});

    assert.ok(!selfCompare.includes('Run shift'));

    const few = buildReport(
      { sorting: results.sorting, filtering: results.filtering },
      { ...snapshot, scenarios: { sorting: snapshot.scenarios.sorting, filtering: snapshot.scenarios.filtering } },
      {}
    );

    assert.ok(!few.includes('Run shift'));
    assert.match(few, /\| Sorting .*-20\.0% 🟢 \| -- /, 'the column reads -- rather than a number');
  });
});

describe('buildReport -- environment and refusal', () => {
  test('the footer names the browser and machine of this run and the browser of the baseline', () => {
    const { results, snapshot } = run(1);
    const report = buildReport(results, snapshot, {
      commit: 'abcdef0123',
      runId: '42',
      environment: {
        chromium: '140.0.7339.16',
        cpuModel: 'AMD EPYC 7763 64-Core Processor',
        cpuCount: 4,
        runnerImage: 'ubuntu24 20260901.1.0',
      },
    });

    assert.ok(report.includes(
      'median of 5 develop runs (2026-09-03T08:00:00.000Z to 2026-09-04T08:00:00.000Z), Chromium 140.0.7339.16'
    ));
    assert.ok(report.includes(
      'Current: commit `abcdef0`, run `42`, Chromium 140.0.7339.16 · AMD EPYC 7763 64-Core Processor ×4 '
      + '· ubuntu24 20260901.1.0.'
    ));
  });

  test('a self-comparison states why no baseline was usable', () => {
    const { results, snapshot } = run(1);
    const report = buildReport(results, { ...snapshot, isSelfCompare: true, isMedian: false }, {
      baselineUnavailable: 'the develop goldens were recorded on a different environment (Chromium 138.0.1 -> 140.0.1)',
    });

    assert.ok(report.includes(
      'this run compared against itself: the develop goldens were recorded on a different environment '
      + '(Chromium 138.0.1 -> 140.0.1)'
    ));
    assert.ok(!report.includes('### Regressions'));
    assert.ok(!report.includes('within tolerance'), 'nothing was assessed');
  });

  test('a golden run with no baseline at all still states why, with its own provenance', () => {
    // Golden mode never synthesizes a self-comparison, so the footer has to carry the reason itself
    // or the develop job summary reads as if comparing silently stopped.
    const { results } = run(1);
    const report = buildReport(results, null, {
      commit: 'abcdef0123',
      environment: { chromium: '140.0.1', cpuModel: 'AMD EPYC 7763', cpuCount: 4 },
      baselineUnavailable: 'the develop goldens were recorded on a different environment (Chromium 138 -> 140.0.1)',
    });

    assert.ok(report.includes(
      'No comparable develop baseline: the develop goldens were recorded on a different environment '
      + '(Chromium 138 -> 140.0.1). Current: commit `abcdef0`, Chromium 140.0.1 · AMD EPYC 7763 ×4.'
    ));
    assert.ok(!report.includes('Δ Total'), 'no delta column without a baseline');
    assert.ok(!report.includes('within tolerance'));
  });

  test('a golden run with no baseline and no reason keeps the footer-less shape', () => {
    const { results } = run(1);

    assert.ok(!buildReport(results, null, {}).includes('<sub>Baseline'));
    assert.ok(!buildReport(results, null, {}).includes('No comparable'));
  });

  test('without a reason, the self-comparison wording is unchanged', () => {
    const { results, snapshot } = run(1);
    const report = buildReport(results, { ...snapshot, isSelfCompare: true, isMedian: false }, {});

    assert.ok(report.includes('this run compared against itself, no develop baseline was available'));
  });
});

describe('buildReport -- per-scenario heap threshold', () => {
  const heapAt = pct => ({
    updateCounters: { jsHeapMaxBytes: 100_000_000 * (1 + pct / 100), jsHeapMaxLabel: 'x' },
  });

  test('a horizontal-scroll heap delta between the shared and its own threshold is not a callout', () => {
    const between = (heapThresholdFor('scroll-left') + REGRESSION_CALLOUT_THRESHOLD_HEAP) / 2;
    const report = buildReport(
      { 'scroll-left': current(100, heapAt(between)), sorting: current(100, heapAt(between)) },
      { timestamp: 't', scenarios: { 'scroll-left': golden(100), sorting: golden(100) } },
      {}
    );

    assert.ok(report.includes('**Sorting** regressed'), 'sorting is still on the shared threshold');
    assert.ok(report.includes('JS heap +7.5% larger'));
    assert.ok(!report.includes('**Scroll Left** regressed'));
    // The table cell agrees with the callout: yellow, not red.
    assert.match(report, /\| Scroll Left .*\+7\.5% 🟡 \|$/m);
    assert.match(report, /\| Sorting .*\+7\.5% 🔴 \|$/m);
  });

  test('above its own threshold, the horizontal-scroll scenario is called out like any other', () => {
    const report = buildReport(
      { 'scroll-left': current(100, heapAt(heapThresholdFor('scroll-left') + 1)) },
      { timestamp: 't', scenarios: { 'scroll-left': golden(100) } },
      {}
    );

    assert.ok(report.includes('**Scroll Left** regressed'));
  });
});

describe('collectRegressions', () => {
  test('lists exactly the scenarios the callouts fire on, with both metrics', () => {
    const { results, snapshot } = run(1, { filtering: 1 + (REGRESSION_CALLOUT_THRESHOLD_TIMING + 5) / 100 });

    results.sorting.updateCounters = { jsHeapMaxBytes: 110_000_000, jsHeapMaxLabel: '110 MB' };

    const regressions = collectRegressions(results, snapshot, {});

    assert.deepEqual(regressions.map(r => r.name).sort(), ['filtering', 'sorting']);

    const filtering = regressions.find(r => r.name === 'filtering');
    const sorting = regressions.find(r => r.name === 'sorting');

    assert.equal(filtering.timingRegressed, true);
    assert.equal(filtering.heapRegressed, false);
    assert.equal(filtering.title, 'Filtering');
    assert.equal(sorting.timingRegressed, false);
    assert.equal(sorting.heapRegressed, true);
    assert.ok(Math.abs(sorting.heapPct - 10) < 1e-9);
  });

  test('carries the run shift and each row relative to it, like the callout prose', () => {
    // Slow runner (+20% everywhere) and one row genuinely 1.5x slower on top: raw +80%, +50% relative.
    const { results, snapshot } = run(1.2, { filtering: 1.5 });
    const regressions = collectRegressions(results, snapshot, {});
    const filtering = regressions.find(r => r.name === 'filtering');

    assert.ok(Math.abs(filtering.shift - 20) < 1e-9);
    assert.ok(Math.abs(filtering.totalPct - 80) < 1e-9);
    assert.ok(Math.abs(filtering.relativePct - 50) < 1e-9);
    // The other eight fired on the raw delta too, and each reads as flat relative to the shift.
    const flat = regressions.filter(r => r.name !== 'filtering');

    assert.equal(flat.length, 8);
    assert.ok(flat.every(r => Math.abs(r.relativePct) < 1e-9));
  });

  test('the relative figure is null when the shift cannot be estimated', () => {
    const { results, snapshot } = run(1.5);
    const two = collectRegressions(
      { sorting: results.sorting, filtering: results.filtering },
      { ...snapshot, scenarios: { sorting: snapshot.scenarios.sorting, filtering: snapshot.scenarios.filtering } },
      {}
    );

    assert.equal(two.length, 2);
    assert.equal(two[0].shift, null);
    assert.equal(two[0].relativePct, null);
  });

  test('is empty on a self-comparison or without a baseline', () => {
    const { results, snapshot } = run(1.5);

    assert.deepEqual(collectRegressions(results, { ...snapshot, isSelfCompare: true }, {}), []);
    assert.deepEqual(collectRegressions(results, null, {}), []);
  });

  test('agrees with the rendered comment', () => {
    const { results, snapshot } = run(1, { 'scroll-up': 1.3 });
    const report = buildReport(results, snapshot, {});
    const regressions = collectRegressions(results, snapshot, {});

    assert.equal(regressions.length, 1);
    assert.ok(report.includes(`**${regressions[0].title}** regressed`));
  });
});
