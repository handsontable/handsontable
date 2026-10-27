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
import { assessReport, buildReport } from '../report-builder.mjs';
import { confirmVerdict, decideGate } from '../gate.mjs';
import {
  BASELINE_INCOMPLETE_LABEL,
  CV_WARNING_THRESHOLD,
  INCOMPARABLE_LABELS,
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

/**
 * @param {string} report
 * @param {string} title -- the scenario's display title
 * @returns {string | undefined} its row in the full table, folded under `<details>`, rather than
 *   its row in the attention table above
 */
function fullTableRow(report, title) {
  return report.slice(report.indexOf('<details>')).split('\n').find(line => line.startsWith(`| ${title} `));
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

    assert.ok(report.includes('Total delta not assessed'));
    assert.ok(report.includes('Filtering'));
  });

  test('withholds the delta when the two sides used different trace windows', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }),
      { crossWindowScenarios: ['sorting'] }
    );
    const row = fullTableRow(report, 'Sorting');

    // Named for what actually happened. The baseline captured everything here; it is the windows
    // that differ, so "baseline incomplete" would be both misleading and factually wrong.
    assert.ok(row.includes(INCOMPARABLE_LABELS['window-mismatch']));
    assert.ok(!row.includes(INCOMPARABLE_LABELS['baseline-incomplete']));
  });

  test('the heap cell and the total cell give the same reason', () => {
    // One row must not carry two explanations for one cause: the heap cell said "baseline
    // incomplete" while the total beside it said "window mismatch".
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }),
      { crossWindowScenarios: ['sorting'] }
    );
    const row = fullTableRow(report, 'Sorting');
    const occurrences = row.split(INCOMPARABLE_LABELS['window-mismatch']).length - 1;

    assert.equal(occurrences, 2, `total and heap must both read window mismatch: ${row}`);
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

    const row = fullTableRow(report, 'Sorting');

    assert.ok(row.includes('n/a'), `expected n/a in the Sorting row: ${row}`);
  });

  test('flags a baseline spread above the warning threshold', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario({ spread: 30 }) }),
      {}
    );

    assert.ok(report.includes('30.0% \u26A0\uFE0F'));
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

    const row = fullTableRow(report, 'Sorting');

    assert.ok(!row.includes('NaN'));
    assert.ok(row.includes('12.5%'), `expected the scripting-only spread in: ${row}`);
  });

  test('renders n/a rather than NaN when no per-iteration values were kept at all', () => {
    const report = buildReport(
      { sorting: currentScenario({ _iterationValues: undefined }) },
      golden({ sorting: goldenScenario() }),
      {}
    );

    const row = fullTableRow(report, 'Sorting');

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

  test('does not flag a hook\'s own spread, which some hooks are wide by construction', () => {
    const report = buildReport(
      {
        'undo-edit': currentScenario({
          hookTiming: 14,
          _iterationValues: {
            categories: { scripting: [19, 20, 21], rendering: [3, 3, 3], painting: [1, 1, 1] },
            hookTiming: [2, 14, 26],
          },
        }),
      },
      golden({ 'undo-edit': goldenScenario({ hookTiming: 14 }) }),
      {}
    );
    const hookRow = report.slice(report.indexOf('### Hook timing')).split('\n')
      .find(line => line.startsWith('| Undo Edit'));

    assert.match(hookRow, /\| 85\.7% +\|/, 'the spread is shown, above the warning line');
    assert.ok(!hookRow.includes('⚠'));
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

    const row = fullTableRow(report, 'Sorting');

    assert.ok(row.includes('\u{1F534}'), `heap delta of +${between}% must be flagged in the table: ${row}`);
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

    const row = fullTableRow(report, 'Sorting');

    assert.ok(!row.includes('\u{1F534}'), `timing delta of +${between}% is below the timing band: ${row}`);
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
    assert.ok(report.includes('Total delta not assessed'));
  });
});

describe('buildReport -- self-comparison', () => {
  // teardown.mjs falls back to comparing a run against itself when no golden exists, stamping the
  // fallback with a fresh timestamp. Branching on the timestamp alone made that indistinguishable
  // from a real single-run golden, so the comment claimed a develop baseline and cleared every
  // scenario as "within tolerance" on a comparison that was 0% by construction.
  const selfCompare = golden({ sorting: goldenScenario({ spread: undefined }) }, {
    isSelfCompare: true,
    timestamp: '2026-09-01T10:43:05.777Z',
  });

  test('never describes a self-comparison as a develop baseline', () => {
    const report = buildReport({ sorting: currentScenario() }, selfCompare, {});

    assert.ok(!report.includes('single develop run'));
    assert.ok(report.includes('compared against itself'));
  });

  test('does not claim the scenarios are within tolerance', () => {
    const report = buildReport({ sorting: currentScenario() }, selfCompare, {});

    assert.ok(!report.includes('within tolerance'));
  });

  test('still reports a real single-run golden as one', () => {
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }),
      {}
    );

    assert.ok(report.includes('single develop run'));
    assert.ok(!report.includes('compared against itself'));
  });
});

describe('buildReport -- cross-window heap', () => {
  test('withholds the heap callout too when the trace windows disagree', () => {
    // jsHeapMaxBytes is a maximum over the UpdateCounters samples inside the parsed window, so two
    // different windows sample two different things. Flagging heap while the total is withheld
    // would also put a regression callout directly above a "not assessed" note for one scenario.
    const report = buildReport(
      {
        sorting: currentScenario({
          updateCounters: { jsHeapMaxBytes: 150_000_000, jsHeapMaxLabel: '150 MB' },
        }),
      },
      golden({ sorting: goldenScenario() }),
      { crossWindowScenarios: ['sorting'] }
    );

    // A heap delta, not the words: the gate's rules line names JS heap on every comment.
    assert.doesNotMatch(report, /JS heap [+-]\d/);
    assert.ok(!report.includes('❌'), 'no scenario is listed as regressed');
    assert.ok(report.includes('Total delta not assessed'));
  });

  test('withholds the heap delta in the summary table too, not only in the callout', () => {
    // The table and the callouts must not reach opposite verdicts on the same run: gating only the
    // callout printed a red "+50.0%" heap cell above a comment clearing the run.
    const report = buildReport(
      {
        sorting: currentScenario({
          updateCounters: { jsHeapMaxBytes: 150_000_000, jsHeapMaxLabel: '150 MB' },
        }),
      },
      golden({ sorting: goldenScenario() }),
      { crossWindowScenarios: ['sorting'] }
    );

    const row = fullTableRow(report, 'Sorting');

    assert.ok(!row.includes('+50.0%'), `heap delta must not be published: ${row}`);
    assert.ok(!row.includes('\u{1F534}'), `nothing in the row may be flagged red: ${row}`);
  });

  test('still assesses heap when only a timing category was missing from the baseline', () => {
    // Heap and the timing categories are measured independently, so a baseline that missed
    // rendering says nothing about whether its heap figure is usable.
    const report = buildReport(
      {
        sorting: currentScenario({
          updateCounters: { jsHeapMaxBytes: 150_000_000, jsHeapMaxLabel: '150 MB' },
        }),
      },
      golden({ sorting: goldenScenario({ categories: { scripting: 20, rendering: 0, painting: 0 } }) }),
      {}
    );

    assert.ok(report.includes('JS heap'));
    assert.ok(report.includes('Total delta not assessed'));
  });

  test('says heap is also not assessed when the total is withheld for a window mismatch', () => {
    // The "Total delta not assessed" note used to read the same regardless of cause, but a window
    // mismatch withholds heap too (jsHeapMaxBytes is a maximum over the samples inside the parsed
    // window) while a baseline-incomplete comparison does not (heap is independent of timing).
    const report = buildReport(
      { sorting: currentScenario() },
      golden({ sorting: goldenScenario() }),
      { crossWindowScenarios: ['sorting'] }
    );

    assert.ok(report.includes('heap also not assessed'));
  });

  test('does not say heap is also not assessed for a baseline-incomplete comparison', () => {
    const report = buildReport(
      { filtering: currentScenario() },
      golden({
        filtering: goldenScenario({ categories: { scripting: 20, rendering: 0, painting: 0 } }),
      }),
      {}
    );

    assert.ok(!report.includes('heap also not assessed'));
  });
});

describe('buildReport -- scenario missing from the baseline entirely', () => {
  test('reports it as having no baseline rather than dropping it silently', () => {
    // A scenario just added to the suite, or one the median window omitted, is not in
    // `goldenScenarios` at all. Silently `continue`-ing past it (as the summary table already does)
    // means it is neither "within tolerance" nor "not assessed" -- it does not appear anywhere.
    const report = buildReport(
      {
        sorting: currentScenario(),
        filtering: currentScenario(),
      },
      golden({ sorting: goldenScenario() }),
      {}
    );

    assert.ok(report.includes('No baseline yet'));
    assert.ok(report.includes('Filtering'));
  });

  test('does not fold a missing baseline into "Total delta not assessed"', () => {
    const report = buildReport(
      {
        sorting: currentScenario(),
        filtering: currentScenario(),
      },
      golden({ sorting: goldenScenario() }),
      {}
    );
    const noBaselineLine = report.split('\n').find(line => line.includes('No baseline yet'));

    assert.ok(!noBaselineLine.includes('Total delta not assessed'));
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

describe('buildReport -- the gate\'s verdict leads', () => {
  const NAMES = ['cell-editing', 'filtering', 'sorting', 'undo-sort', 'scroll-down', 'scroll-up'];
  // Active time 24 ms (20 + 3 + 1); `slower(1.2)` is +20%, +4.8 ms.
  // The whole slowdown lands in scripting, so rendering and painting stay comparable at 3 and 1.
  const slower = factor => currentScenario({
    categories: { scripting: 20 * factor + 4 * (factor - 1), rendering: 3, painting: 1 },
  });
  const quiet = (names = NAMES) => Object.fromEntries(names.map(name => [name, currentScenario()]));
  const baseline = (names = NAMES) => golden(Object.fromEntries(names.map(name => [name, goldenScenario()])));
  const verdictOf = (results, base, options = {}) => decideGate({
    assessment: assessReport(results, base, {}), baseline: base, ...options,
  });
  // Everything a reader sees before opening the fold.
  const visible = report => report.slice(0, report.indexOf('<details>'));

  test('a quiet run says so in one line, and folds the full table away', () => {
    const report = buildReport(quiet(), baseline(), {});

    assert.match(report, /^## ⚡ Performance: ✅ all 6 scenarios within tolerance$/m);
    assert.ok(!visible(report).includes('| Status'), 'no attention table when nothing needs attention');
    assert.ok(report.includes('<details><summary>All 6 scenarios</summary>\n\n| Scenario'),
      'the blank line after the summary is what lets GitHub render the table inside the fold');
    assert.ok(report.trimEnd().endsWith('</details>'));
  });

  test('the visible part of a quiet comment does not grow with the number of scenarios', () => {
    const few = ['sorting', 'filtering'];

    assert.equal(
      visible(buildReport(quiet(few), baseline(few), {})).split('\n').length,
      visible(buildReport(quiet(), baseline(), {})).split('\n').length
    );
  });

  test('a regression is counted in the headline and listed with what moved', () => {
    const report = buildReport({ ...quiet(), sorting: slower(1.2) }, baseline(), {});

    assert.match(report, /^## ⚡ Performance: ❌ 1 of 6 scenarios regressed$/m);
    assert.match(
      visible(report),
      /^\| Sorting +\| ❌ regressed +\| \+20\.0% +\| \+4\.8 ms +\| \+0\.0% +\| Scripting \+24\.0% slower/m
    );
  });

  test('a scenario above the watch line is listed, and the run stays within tolerance', () => {
    const report = buildReport({ ...quiet(), filtering: slower(1.07) }, baseline(), {});

    assert.match(report, /^## ⚡ Performance: ✅ all 6 scenarios within tolerance · 1 to watch$/m);
    assert.match(visible(report), /^\| Filtering +\| 🟡 to watch +\| \+7\.0% /m);
  });

  test('a level the newest develop golden already shows is listed as such', () => {
    const results = { ...quiet(), sorting: slower(1.2) };
    const base = baseline();
    const verdict = verdictOf(results, base, { newestAssessment: assessReport(results, base, {}) });
    const report = buildReport(results, base, {}, undefined, verdict);

    assert.match(report, /^## ⚡ Performance: ✅ all 6 scenarios within tolerance · 1 already on develop$/m);
    assert.match(visible(report), /^\| Sorting +\| ➖ already on develop /m);
  });

  test('a pull request run in block mode says a reviewer approves on the run, or a fix is pushed', () => {
    const results = { ...quiet(), sorting: slower(1.2) };
    const verdict = verdictOf(results, baseline(), { mode: 'block' });
    const report = buildReport(results, baseline(), { gated: true, runUrl: 'https://example.test/runs/7' },
      undefined, verdict);

    assert.ok(report.includes('Waiting for approval'));
    assert.ok(report.includes('`performance-approval` deployment on the [workflow run](https://example.test/runs/7)'));
  });

  test('a pull request run in warn mode says nothing waits', () => {
    const results = { ...quiet(), sorting: slower(1.2) };
    const report = buildReport(results, baseline(), { gated: true }, undefined, verdictOf(results, baseline()));

    assert.ok(report.includes('The gate is in warn mode, so nothing waits'));
    assert.ok(!report.includes('Waiting for approval'));
  });

  test('a run the gate does not act on states the verdict alone', () => {
    const results = { ...quiet(), sorting: slower(1.2) };
    const verdict = verdictOf(results, baseline(), { mode: 'block' });
    const report = buildReport(results, baseline(), {}, undefined, verdict);

    assert.match(report, /❌ 1 of 6 scenarios regressed$/m);
    assert.ok(!report.includes('approval'));
  });

  test('a pull request into another branch says it was not assessed, and why', () => {
    const results = { ...quiet(), sorting: slower(2) };
    const verdict = verdictOf(results, baseline(), { baseRef: 'prod-docs/18.1' });
    const report = buildReport(results, baseline(), {}, undefined, verdict);

    assert.match(report, /^## ⚡ Performance: ⏸ not assessed$/m);
    assert.ok(report.includes('Not assessed: the pull request targets prod-docs/18.1, and the baseline is develop.'));
    assert.ok(!visible(report).includes('❌'));
  });

  test('the re-run is shown: a confirmed regression, and one it cleared with its first numbers', () => {
    const first = { ...quiet(), sorting: slower(1.2), filtering: slower(1.3) };
    const second = { ...quiet(), sorting: slower(1.2) };
    const verdict = confirmVerdict(verdictOf(first, baseline()), verdictOf(second, baseline()));
    const report = buildReport(second, baseline(), {}, undefined, verdict);

    assert.match(report, /^## ⚡ Performance: ❌ 1 of 6 scenarios regressed · 1 cleared on re-run$/m);
    assert.match(visible(report), /^\| Sorting +\| ❌ regressed, confirmed on re-run /m);
    assert.match(visible(report), /^\| Filtering +\| ✔️ cleared on re-run +\| \+30\.0% .*\| first run only +\|$/m);
  });

  test('a small scenario over the line in percent but under the ms floor is watched, not failed', () => {
    // 13 ms -> 14.56 ms: +12%, but only +1.56 ms, under the gate's 2 ms floor.
    const small = { categories: { scripting: 9, rendering: 3, painting: 1 } };
    const report = buildReport(
      { 'undo-sort': currentScenario({ categories: { scripting: 10.56, rendering: 3, painting: 1 } }) },
      golden({ 'undo-sort': goldenScenario(small) }),
      {}
    );

    assert.match(report, /^## ⚡ Performance: ✅ all 1 scenario within tolerance · 1 to watch$/m);
    assert.match(visible(report), /^\| Undo Sort +\| 🟡 to watch /m);
    assert.match(fullTableRow(report, 'Undo Sort'), /\| \+12\.0% 🟡 +\|/);
    assert.ok(!report.includes('\u{1F534}'), 'nothing is painted red');
  });

  test('a heap-only regression lists the heap, not three flat timing categories', () => {
    const report = buildReport({
      ...quiet(),
      sorting: currentScenario({ updateCounters: { jsHeapMaxBytes: 107_500_000, jsHeapMaxLabel: '108 MB' } }),
    }, baseline(), {});
    const row = visible(report).split('\n').find(line => line.startsWith('| Sorting '));

    assert.match(row, /\| JS heap \+7\.5% larger +\|$/);
    assert.ok(!row.includes('Scripting'));
  });

  test('the gate\'s rules are stated, and only where something was compared', () => {
    assert.ok(buildReport(quiet(), baseline(), {}).includes('<sub>Gate: a scenario fails above +10% and +2 ms'));
    assert.ok(!buildReport(quiet(), null, {}).includes('<sub>Gate:'));
    assert.ok(!buildReport(quiet(), { ...baseline(), isSelfCompare: true }, {}).includes('<sub>Gate:'));
  });
});

describe('buildReport -- markers only where the gate acts', () => {
  test('a small change carries no marker, either way', () => {
    const report = buildReport(
      {
        sorting: currentScenario({ categories: { scripting: 20.72, rendering: 3, painting: 1 } }),
        filtering: currentScenario({ categories: { scripting: 19.28, rendering: 3, painting: 1 } }),
      },
      golden({ sorting: goldenScenario(), filtering: goldenScenario() }),
      {}
    );

    assert.match(fullTableRow(report, 'Sorting'), /\| \+3\.0% +\|/);
    assert.match(fullTableRow(report, 'Filtering'), /\| -3\.0% +\|/);
    assert.ok(!report.includes('\u{1F535}'), 'no blue marker anywhere');
    assert.ok(!report.includes('\u{1F7E1}'), 'no yellow marker under the watch line');
  });

  test('only the baseline spread is flagged, never the run\'s own', () => {
    // A run whose iterations disagree by far more than the warning line, as undo-edit's always do.
    const wide = currentScenario({
      _iterationValues: { categories: { scripting: [5, 20, 35], rendering: [3, 3, 3], painting: [1, 1, 1] } },
    });
    const report = buildReport(
      { sorting: wide },
      golden({ sorting: goldenScenario({ spread: CV_WARNING_THRESHOLD + 5 }) }),
      {}
    );
    const [, runCv, baseCv] = fullTableRow(report, 'Sorting').match(/\| ([\d.]+%[^/|]*)\/ ([\d.]+%[^|]*)\|/);

    assert.ok(Number.parseFloat(runCv) > CV_WARNING_THRESHOLD, 'the run spread is above the line');
    assert.ok(!runCv.includes('⚠'), `the run spread is not flagged: ${runCv}`);
    assert.ok(baseCv.includes('⚠'), `the baseline spread is: ${baseCv}`);
  });
});
