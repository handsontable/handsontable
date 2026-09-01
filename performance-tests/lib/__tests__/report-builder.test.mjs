// Unit tests for the markdown report -- the sticky comment posted on every pull request.
//
// This is the artifact reviewers actually read, and the defect this suite guards is that it used to
// publish confident red callouts computed from baselines that could not support them. The cases
// below pin the four things that changed: a total delta is withheld (and said to be withheld) when
// the baseline is unusable, both reliability numbers are shown and labeled distinctly, the callout
// fires on the timing threshold for timing and the heap threshold for heap, and the comment states
// whether it compared against one develop run or several.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../report-builder.mjs';
import {
  BASELINE_INCOMPLETE_LABEL,
  REGRESSION_CALLOUT_THRESHOLD_TIMING,
  REGRESSION_CALLOUT_THRESHOLD_HEAP,
} from '../thresholds.mjs';

/**
 * @param {object} [overrides]
 * @returns {object} a current-run scenario result
 */
function currentScenario(overrides = {}) {
  return {
    categories: { scripting: 20, rendering: 3, painting: 1 },
    updateCounters: { jsHeapMaxBytes: 100_000_000, jsHeapMaxLabel: '100 MB' },
    rangeEnd: 90,
    runs: 3,
    windowSource: 'marks',
    _iterationValues: {
      categories: { scripting: [19, 20, 21], rendering: [3, 3, 3], painting: [1, 1, 1] },
      rangeEnd: [89, 90, 91],
    },
    ...overrides,
  };
}

/**
 * @param {object} [overrides]
 * @returns {object} a golden (baseline) scenario entry
 */
function goldenScenario(overrides = {}) {
  return {
    categories: { scripting: 20, rendering: 3, painting: 1 },
    updateCounters: { jsHeapMaxBytes: 100_000_000, jsHeapMaxLabel: '100 MB' },
    rangeEnd: 90,
    windowSource: 'marks',
    spread: 12,
    ...overrides,
  };
}

/**
 * @param {Record<string, object>} scenarios
 * @param {object} [extra]
 * @returns {object} a golden snapshot
 */
function golden(scenarios, extra = {}) {
  return { timestamp: '2026-09-01T08:00:00.000Z', scenarios, ...extra };
}

describe('buildReport -- incomplete baseline', () => {
  test('withholds the total delta when the baseline missed a category', () => {
    // The filed defect, reproduced from the report data quoted in the task: the golden captured
    // zero rendering and zero painting, and the comment published +115.7%.
    const report = buildReport(
      {
        filtering: currentScenario({
          categories: { scripting: 39.62, rendering: 3.25, painting: 0.69 },
        }),
      },
      golden({
        filtering: goldenScenario({ categories: { scripting: 20.20, rendering: 0, painting: 0 } }),
      }),
      {}
    );

    assert.ok(report.includes(BASELINE_INCOMPLETE_LABEL));
    assert.ok(!report.includes('115.7%'), 'must not publish a delta against a zero baseline');
  });

  test('says the scenario was not assessed rather than clearing it', () => {
    const report = buildReport(
      { filtering: currentScenario() },
      golden({
        filtering: goldenScenario({ categories: { scripting: 20, rendering: 0, painting: 0 } }),
      }),
      {}
    );

    assert.ok(report.includes('Not assessed'));
    assert.ok(report.includes('Filtering'));
  });

  test('withholds the delta when the two sides used different trace windows', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }),
      { crossWindowScenarios: ['sorting'] }
    );

    assert.ok(report.includes(BASELINE_INCOMPLETE_LABEL));
  });

  test('a comparable baseline still publishes its delta', () => {
    const report = buildReport(
      { sorting: currentScenario({ categories: { scripting: 25, rendering: 3, painting: 1 } }) },
      golden({ sorting: goldenScenario() }),
      {}
    );

    assert.ok(!report.includes(BASELINE_INCOMPLETE_LABEL));
    assert.ok(report.includes('+20.8%'));
  });
});

describe('buildReport -- reliability columns', () => {
  test('shows the intra-run spread and the baseline spread as separate numbers', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario({ spread: 18.5 }) }),
      {}
    );

    assert.ok(report.includes('CV run / base'), 'the header must distinguish the two');
    // Baseline spread comes straight from the median window.
    assert.ok(report.includes('18.5%'));
  });

  test('renders the baseline spread as n/a when the baseline carries none', () => {
    // Three paths reach here without a history window: golden mode, the self-compare fallback, and
    // a thin history. A rendered 0.0% would claim a perfectly stable baseline.
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario({ spread: undefined }) }),
      {}
    );

    assert.ok(report.includes('n/a'));
  });

  test('flags a baseline spread above the warning threshold', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario({ spread: 30 }) }),
      {}
    );

    assert.ok(report.includes('30.0% ⚠️'));
  });

  test('computes the intra-run spread when a real trace omitted a category entirely', () => {
    // Not every trace records every category, so the per-iteration arrays can be ragged or absent.
    // Recombining them must not produce NaN or an empty spread just because rendering is missing.
    const report = buildReport(
      {
        sorting: currentScenario({
          categories: { scripting: 80, rendering: 0, painting: 0 },
          _iterationValues: { categories: { scripting: [70, 80, 90] } },
        }),
      },
      golden({ sorting: goldenScenario({ categories: { scripting: 80, rendering: 0, painting: 0 } }) }),
      {}
    );

    const row = report.split('\n').find(line => line.includes('| Sorting'));

    assert.ok(!row.includes('NaN'));
    assert.ok(row.includes('12.5%'), `expected the scripting-only spread in: ${row}`);
  });

  test('renders n/a rather than NaN when no per-iteration values were kept at all', () => {
    const report = buildReport(
      { sorting: currentScenario({ _iterationValues: undefined }) },
      golden({ sorting: goldenScenario() }),
      {}
    );

    const row = report.split('\n').find(line => line.includes('| Sorting'));

    assert.ok(!row.includes('NaN'));
    assert.ok(row.includes('n/a'));
  });

  test('reports hook timing with its own spread for the scenarios that measure it', () => {
    const report = buildReport(
      {
        filtering: currentScenario({
          hookTiming: 47,
          _iterationValues: {
            categories: { scripting: [19, 20, 21], rendering: [3, 3, 3], painting: [1, 1, 1] },
            hookTiming: [45, 47, 49],
          },
        }),
      },
      golden({ filtering: goldenScenario({ hookTiming: 36 }) }),
      {}
    );

    assert.ok(report.includes('Hook timing'));
    assert.ok(report.includes('47 ms'));
  });

  test('omits the hook-timing section entirely when no scenario measures a hook', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }),
      {}
    );

    assert.ok(!report.includes('Hook timing'));
  });
});

describe('buildReport -- callouts', () => {
  test('does not call out a timing change below the timing threshold', () => {
    const under = REGRESSION_CALLOUT_THRESHOLD_TIMING - 2;
    const report = buildReport(
      {
        sorting: currentScenario({
          categories: { scripting: 24 * (1 + under / 100), rendering: 0, painting: 0 },
        }),
      },
      golden({ sorting: goldenScenario({ categories: { scripting: 24, rendering: 0, painting: 0 } }) }),
      {}
    );

    assert.ok(report.includes('within tolerance'));
  });

  test('calls out a timing change above the timing threshold', () => {
    const over = REGRESSION_CALLOUT_THRESHOLD_TIMING + 5;
    const report = buildReport(
      {
        sorting: currentScenario({
          categories: { scripting: 24 * (1 + over / 100), rendering: 0, painting: 0 },
        }),
      },
      golden({ sorting: goldenScenario({ categories: { scripting: 24, rendering: 0, painting: 0 } }) }),
      {}
    );

    assert.ok(report.includes('regressed'));
    assert.ok(!report.includes('within tolerance'));
  });

  test('the heap column is banded on the heap threshold, not the timing one', () => {
    // Guards the specific drift this PR exists to remove: the Δ Heap cell passes the heap threshold
    // explicitly, so dropping that argument would silently put heap back on the timing band while
    // every callout test stayed green. A growth between the two thresholds must read as a
    // regression in the table, not merely in the callout below it.
    const between = (REGRESSION_CALLOUT_THRESHOLD_HEAP + REGRESSION_CALLOUT_THRESHOLD_TIMING) / 2;
    const report = buildReport(
      {
        sorting: currentScenario({
          updateCounters: {
            jsHeapMaxBytes: 100_000_000 * (1 + between / 100),
            jsHeapMaxLabel: '110 MB',
          },
        }),
      },
      golden({ sorting: goldenScenario() }),
      {}
    );

    const row = report.split('\n').find(line => line.includes('| Sorting'));

    assert.ok(row.includes('🔴'), `heap delta of +${between}% must be flagged in the table: ${row}`);
  });

  test('the timing column is not banded on the heap threshold', () => {
    const between = (REGRESSION_CALLOUT_THRESHOLD_HEAP + REGRESSION_CALLOUT_THRESHOLD_TIMING) / 2;
    const report = buildReport(
      {
        sorting: currentScenario({
          categories: { scripting: 24 * (1 + between / 100), rendering: 0, painting: 0 },
        }),
      },
      golden({ sorting: goldenScenario({ categories: { scripting: 24, rendering: 0, painting: 0 } }) }),
      {}
    );

    const row = report.split('\n').find(line => line.includes('| Sorting'));

    assert.ok(!row.includes('🔴'), `timing delta of +${between}% is below the timing band: ${row}`);
  });

  test('heap is judged on the heap threshold, which is tighter than timing', () => {
    // A heap growth between the two thresholds must fire. Sharing one constant would miss it.
    const between = (REGRESSION_CALLOUT_THRESHOLD_HEAP + REGRESSION_CALLOUT_THRESHOLD_TIMING) / 2;
    const report = buildReport(
      {
        sorting: currentScenario({
          updateCounters: {
            jsHeapMaxBytes: 100_000_000 * (1 + between / 100),
            jsHeapMaxLabel: '110 MB',
          },
        }),
      },
      golden({ sorting: goldenScenario() }),
      {}
    );

    assert.ok(report.includes('JS heap'));
    assert.ok(report.includes('larger'));
  });

  test('an incomplete baseline never produces a timing callout', () => {
    const report = buildReport(
      {
        sorting: currentScenario({ categories: { scripting: 500, rendering: 50, painting: 10 } }),
      },
      golden({ sorting: goldenScenario({ categories: { scripting: 20, rendering: 0, painting: 0 } }) }),
      {}
    );

    assert.ok(!report.includes('regressed +'));
    assert.ok(report.includes('Not assessed'));
  });
});

describe('buildReport -- provenance', () => {
  test('states how many develop runs the baseline is a median of', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }, {
        isMedian: true,
        medianWindowSize: 5,
        medianSourceTimestamps: ['2026-09-01T08-28-12Z', '2026-08-31T08-44-08Z'],
      }),
      {}
    );

    assert.ok(report.includes('median of 5 develop runs'));
    assert.ok(report.includes('2026-08-31T08-44-08Z to 2026-09-01T08-28-12Z'));
  });

  test('says so when the baseline is a single run', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }),
      {}
    );

    assert.ok(report.includes('single develop run'));
    assert.ok(!report.includes('median of'));
  });

  test('records the commit and run the current side came from', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }),
      { commit: 'abcdef1234567890', runId: '33493660272' }
    );

    assert.ok(report.includes('commit `abcdef1`'));
    assert.ok(report.includes('run `33493660272`'));
  });

  test('omits the provenance line entirely when there is no baseline', () => {
    const report = buildReport({ sorting: currentScenario() }, null, {});

    assert.ok(!report.includes('Baseline:'));
  });
});

describe('buildReport -- no baseline', () => {
  test('drops the delta columns but keeps the intra-run spread', () => {
    const report = buildReport({ sorting: currentScenario() }, null, {});

    assert.ok(!report.includes('Δ Total'));
    assert.ok(report.includes('CV run'));
  });
});
