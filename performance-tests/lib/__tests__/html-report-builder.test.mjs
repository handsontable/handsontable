// Unit tests for the self-contained HTML performance report.
//
// The report is a single HTML file that serializes its whole data payload into an inline
// `<script>` block and renders it client-side. Two properties matter enough to pin: values that
// reach the page from CI (a branch name on a fork pull request, most of all) cannot break out of
// that block, and a delta the report refuses to publish on the scenario card is not quietly
// published again in the detail table one click below it.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildHtmlReport } from '../html-report-builder.mjs';

const ITERATIONS = {
  categories: { scripting: [19, 20, 21], rendering: [3, 3, 3], painting: [1, 1, 1] },
  rangeEnd: [89, 90, 91],
};

/**
 * @param {object} [overrides]
 * @returns {object}
 */
function currentScenario(overrides = {}) {
  return {
    categories: { scripting: 20, rendering: 3, painting: 1 },
    updateCounters: { jsHeapMaxBytes: 100_000_000, jsHeapMaxLabel: '100 MB' },
    rangeEnd: 90,
    runs: 3,
    windowSource: 'marks',
    _iterationValues: ITERATIONS,
    ...overrides,
  };
}

/**
 * @param {object} [overrides]
 * @returns {object}
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
 * @param {string} html
 * @returns {object} the payload the client script reads
 */
function payloadOf(html) {
  return JSON.parse(html.match(/window\.__PERF_DATA__ = ([\s\S]*?);\n<\/script>/)[1]);
}

describe('buildHtmlReport -- script-block containment', () => {
  // GITHUB_HEAD_REF reaches the payload, and a fork pull request chooses its own branch name.
  // JSON.stringify does not escape "<", so without the escape the branch name below would close
  // the inline script and everything after it would be parsed as markup.
  const hostile = 'x</script><img src=x onerror=alert(1)>';

  test('a hostile branch name cannot close the inline script block', () => {
    const html = buildHtmlReport(
      { sorting: currentScenario() },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      { branch: hostile }
    );

    assert.ok(!html.includes('</script><img'), 'the raw closing tag must not survive');
    assert.equal((html.match(/<script/g) || []).length, 2, 'no extra script element');
  });

  test('the escaped payload is still valid JSON carrying the original value', () => {
    const html = buildHtmlReport(
      { sorting: currentScenario() },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      { branch: hostile }
    );

    // "<" escaped as < is the same character to a JSON parser, so nothing is lost.
    assert.equal(payloadOf(html).meta.branch, hostile);
  });

  test('a hostile PR number is escaped in the title rather than interpolated raw', () => {
    const html = buildHtmlReport(
      { sorting: currentScenario() },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      { prNumber: hostile }
    );

    const title = html.split('\n').find(line => line.startsWith('<title>'));

    assert.ok(!title.includes('<img'));
    assert.ok(title.includes('&lt;/script&gt;'));
  });
});

describe('buildHtmlReport -- incomplete baseline', () => {
  const incomplete = () => buildHtmlReport(
    {
      filtering: currentScenario({
        categories: { scripting: 39.62, rendering: 3.25, painting: 0.69 },
      }),
    },
    {
      timestamp: 't',
      scenarios: {
        filtering: goldenScenario({ categories: { scripting: 20.20, rendering: 0, painting: 0 } }),
      },
    },
    {}
  );

  test('withholds the Total active delta in the detail table, not just on the badge', () => {
    // The badge said "baseline incomplete" while the detail row published +115.6% in red -- the
    // exact number the guard exists to suppress, one click away.
    const row = payloadOf(incomplete()).scenarios[0].detailedMetrics
      .find(r => r.key === 'total-active');

    assert.equal(row.change, null);
    assert.equal(row.incomplete, true);
  });

  test('the withheld percentage appears nowhere in the document', () => {
    assert.ok(!incomplete().includes('115.'));
  });

  test('counts the scenario as not assessed rather than as neutral', () => {
    const { summary } = payloadOf(incomplete());

    assert.equal(summary.notAssessed, 1);
    assert.equal(summary.neutral, 0);
  });

  test('a comparable baseline is still published and still counted as neutral', () => {
    const html = buildHtmlReport(
      { sorting: currentScenario({ categories: { scripting: 21, rendering: 3, painting: 1 } }) },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    );
    const { scenarios, summary } = payloadOf(html);

    assert.notEqual(scenarios[0].totalChange, null);
    assert.equal(scenarios[0].baselineIncomplete, false);
    assert.equal(summary.notAssessed, 0);
    assert.equal(summary.neutral, 1);
  });
});

describe('buildHtmlReport -- cross-window comparison', () => {
  // teardown warns that these deltas "are not measurements of a code change; they are the two
  // windows disagreeing". Gating only the total left the per-category rows, the quick-metric strip
  // and the heap chart publishing them, so a card badged "baseline incomplete" carried red
  // +900% rows underneath and the dashboard counted it as a regression.
  const crossWindow = () => payloadOf(buildHtmlReport(
    {
      sorting: currentScenario({
        categories: { scripting: 200, rendering: 30, painting: 10 },
        updateCounters: { jsHeapMaxBytes: 150_000_000, jsHeapMaxLabel: '150 MB' },
      }),
    },
    { timestamp: 't', scenarios: { sorting: goldenScenario() } },
    { crossWindowScenarios: ['sorting'] }
  )).scenarios[0];

  test('withholds every per-category delta, not just the total', () => {
    const changes = crossWindow().detailedMetrics
      .filter(r => ['scripting', 'rendering', 'painting'].includes(r.key))
      .map(r => r.change);

    assert.deepEqual(changes, [null, null, null]);
  });

  test('withholds the quick-metric deltas', () => {
    const { metrics } = crossWindow();

    assert.equal(metrics.scripting.change, null);
    assert.equal(metrics.rendering.change, null);
    assert.equal(metrics.painting.change, null);
    assert.equal(metrics.total.change, null);
  });

  test('withholds the heap delta, because the heap max is sampled inside the window', () => {
    assert.equal(crossWindow().heap.change, null);
  });

  test('withholds every memory delta, which are extrema over the same window', () => {
    // Heap min/max, node count and listener count are all UpdateCounters extrema taken inside the
    // parsed window, so the argument that invalidates the heap maximum invalidates each of them.
    const changes = crossWindow().memory.map(r => r.change);

    assert.ok(changes.length > 0, 'the fixture must produce memory rows');
    assert.deepEqual(changes, changes.map(() => null));
    assert.ok(crossWindow().memory.every(r => r.incomplete === true));
  });

  test('does not count the scenario as a regression', () => {
    const scenario = crossWindow();

    assert.equal(scenario.isRegression, false);
    assert.equal(scenario.baselineIncomplete, true);
  });

  test('a same-window comparison still publishes heap and per-category deltas', () => {
    const scenario = payloadOf(buildHtmlReport(
      {
        sorting: currentScenario({
          updateCounters: { jsHeapMaxBytes: 150_000_000, jsHeapMaxLabel: '150 MB' },
        }),
      },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    )).scenarios[0];

    assert.notEqual(scenario.heap.change, null);
    assert.notEqual(scenario.metrics.scripting.change, null);
  });
});

describe('buildHtmlReport -- incomplete capture on the current side', () => {
  // The branch that survived the first round: per-category deltas were gated on the window alone,
  // so when THIS run missed a category the card badged itself incomparable and then published a
  // green -100.0% for that very category one row below. pctChange's zero-denominator guard masks
  // the mirror case, which is why only this direction leaked.
  const currentMissed = () => payloadOf(buildHtmlReport(
    { sorting: currentScenario({ categories: { scripting: 20, rendering: 0, painting: 0 } }) },
    { timestamp: 't', scenarios: { sorting: goldenScenario() } },
    {}
  )).scenarios[0];

  test('publishes no delta for a category this run failed to capture', () => {
    const { metrics } = currentMissed();

    assert.equal(metrics.rendering.change, null);
    assert.equal(metrics.painting.change, null);
    assert.equal(metrics.total.change, null);
  });

  test('withholds the same categories in the detail table', () => {
    const rows = currentMissed().detailedMetrics;

    assert.equal(rows.find(r => r.key === 'rendering').change, null);
    assert.equal(rows.find(r => r.key === 'painting').change, null);
  });

  test('still publishes the categories both sides did capture', () => {
    // Withholding everything would hide usable data behind one failed capture.
    assert.notEqual(currentMissed().metrics.scripting.change, null);
    assert.equal(
      currentMissed().detailedMetrics.find(r => r.key === 'scripting').incomplete, false
    );
  });

  test('blames this run rather than the baseline', () => {
    const scenario = currentMissed();

    assert.equal(scenario.incompleteLabel, 'capture incomplete');
    assert.ok(scenario.incompleteReason.includes('this run'));
    assert.ok(!scenario.incompleteReason.includes('baseline'));
  });

  test('is never counted as an improvement', () => {
    assert.equal(payloadOf(buildHtmlReport(
      { sorting: currentScenario({ categories: { scripting: 20, rendering: 0, painting: 0 } }) },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    )).summary.improvements, 0);
  });
});

describe('buildHtmlReport -- gating boundaries', () => {
  test('a category zero on both sides keeps the comparison comparable', () => {
    // Neither side captured it, so nothing is missing and nothing is withheld. It renders "--"
    // rather than 0%, because pctChange rightly refuses a zero denominator.
    const scenario = payloadOf(buildHtmlReport(
      { sorting: currentScenario({ categories: { scripting: 22, rendering: 3, painting: 0 } }) },
      {
        timestamp: 't',
        scenarios: {
          sorting: goldenScenario({ categories: { scripting: 20, rendering: 3, painting: 0 } }),
        },
      },
      {}
    )).scenarios[0];

    assert.equal(scenario.baselineIncomplete, false);
    assert.equal(scenario.metrics.painting.incomplete, false);
    assert.notEqual(scenario.metrics.scripting.change, null);
  });

  test('non-active categories still publish when only a timing category was missed', () => {
    // loading/other/experience/idle never enter a total, so an incomplete active category says
    // nothing about them. Only a window mismatch invalidates them.
    const rows = payloadOf(buildHtmlReport(
      {
        sorting: currentScenario({
          categories: { scripting: 20, rendering: 0, painting: 1, loading: 25 },
        }),
      },
      {
        timestamp: 't',
        scenarios: {
          sorting: goldenScenario({ categories: { scripting: 20, rendering: 3, painting: 1, loading: 10 } }),
        },
      },
      {}
    )).scenarios[0].detailedMetrics;

    assert.equal(rows.find(r => r.key === 'rendering').change, null);
    assert.notEqual(rows.find(r => r.key === 'loading').change, null);
  });

  test('a window mismatch withholds the non-active categories too', () => {
    const rows = payloadOf(buildHtmlReport(
      { sorting: currentScenario({ categories: { scripting: 20, rendering: 3, painting: 1, loading: 25 } }) },
      {
        timestamp: 't',
        scenarios: {
          sorting: goldenScenario({ categories: { scripting: 20, rendering: 3, painting: 1, loading: 10 } }),
        },
      },
      { crossWindowScenarios: ['sorting'] }
    )).scenarios[0].detailedMetrics;

    assert.equal(rows.find(r => r.key === 'loading').change, null);
  });

  test('the badge carries the long explanation as its tooltip', () => {
    // The short label cannot name the categories, and the HTML report is the artifact opened for
    // detail -- it must not be the one surface that loses it.
    const scenario = payloadOf(buildHtmlReport(
      { sorting: currentScenario({ categories: { scripting: 20, rendering: 0, painting: 0 } }) },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    )).scenarios[0];

    assert.ok(scenario.incompleteReason.includes('rendering'));
    assert.ok(scenario.incompleteReason.includes('painting'));
  });
});

describe('buildHtmlReport -- scenario absent from the baseline', () => {
  // A scenario just added to the suite, or one the median omitted because too few windowed
  // snapshots carried it. There is nothing to compare against, which is not a failed capture --
  // the markdown path returns early and prints "--", and the HTML must agree.
  const newScenario = () => payloadOf(buildHtmlReport(
    { sorting: currentScenario(), 'brand-new': currentScenario() },
    { timestamp: 't', scenarios: { sorting: goldenScenario() } },
    {}
  )).scenarios.find(s => s.name === 'brand-new');

  test('is not reported as an incomplete capture', () => {
    const scenario = newScenario();

    assert.equal(scenario.hasBaseline, false);
    assert.equal(scenario.baselineIncomplete, false);
    assert.equal(scenario.incompleteLabel, null);
  });

  test('marks no category incomplete, so the detail table reads "--" like the comment', () => {
    const scenario = newScenario();

    assert.equal(scenario.metrics.scripting.incomplete, false);
    assert.equal(scenario.metrics.rendering.incomplete, false);
    assert.deepEqual(
      scenario.detailedMetrics
        .filter(r => ['scripting', 'rendering', 'painting'].includes(r.key))
        .map(r => r.incomplete),
      [false, false, false]
    );
  });

  test('is not counted as not-assessed, which is reserved for a failed comparison', () => {
    assert.equal(newScenario().notAssessed, false);
  });

  test('is counted in its own noBaseline bucket, not folded into Neutral', () => {
    // "Neutral" claims the scenario is flat against its baseline -- the one thing not known about a
    // scenario the baseline does not contain at all. Before this bucket existed it fell into the
    // remainder, i.e. Neutral, the same "assessed by omission" failure notAssessed exists to
    // prevent for a failed comparison.
    const payload = payloadOf(buildHtmlReport(
      { sorting: currentScenario(), 'brand-new': currentScenario() },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    ));
    const brandNew = payload.scenarios.find(s => s.name === 'brand-new');

    assert.equal(payload.summary.noBaseline, 1);
    assert.equal(brandNew.hasBaseline, false);
  });
});

describe('buildHtmlReport -- dashboard and filters agree', () => {
  // The counter and the filter are computed on opposite sides of the serialization boundary, so
  // they can only stay consistent by reading the same flag. Deriving the predicate twice is what
  // made the Neutral list longer than the Neutral count.
  const mixed = () => payloadOf(buildHtmlReport(
    {
      flat: currentScenario(),
      incomparable: currentScenario({ categories: { scripting: 20, rendering: 0, painting: 0 } }),
      leaky: currentScenario({
        updateCounters: { jsHeapMaxBytes: 200_000_000, jsHeapMaxLabel: '200 MB' },
      }),
    },
    {
      timestamp: 't',
      scenarios: {
        flat: goldenScenario(),
        incomparable: goldenScenario(),
        leaky: goldenScenario(),
      },
    },
    {}
  ));

  test('every scenario falls into exactly one dashboard bucket', () => {
    const { summary } = mixed();
    const buckets = summary.regressions + summary.improvements + summary.neutral
      + summary.notAssessed + summary.noBaseline;

    assert.equal(buckets, summary.total);
  });

  test('a scenario absent from the baseline falls into noBaseline, not Neutral', () => {
    const payload = payloadOf(buildHtmlReport(
      {
        flat: currentScenario(),
        'brand-new': currentScenario(),
      },
      { timestamp: 't', scenarios: { flat: goldenScenario() } },
      {}
    ));
    const flagged = payload.scenarios.filter(s => !s.hasBaseline);

    assert.equal(flagged.length, payload.summary.noBaseline);
    assert.equal(payload.summary.noBaseline, 1);
    assert.equal(payload.summary.neutral, 1, 'only the flat scenario counts as Neutral');
  });

  test('the not-assessed flag drives both the counter and the filterable set', () => {
    const payload = mixed();
    const flagged = payload.scenarios.filter(s => s.notAssessed);

    assert.equal(flagged.length, payload.summary.notAssessed);
    assert.equal(flagged.length, 1);
    assert.equal(flagged[0].name, 'incomparable');
  });

  test('a scenario that both failed comparison and regressed counts as a regression', () => {
    // It produced a callout, so it was assessed. Counting it in both buckets would double-count.
    const scenario = payloadOf(buildHtmlReport(
      {
        sorting: currentScenario({
          categories: { scripting: 20, rendering: 0, painting: 0 },
          updateCounters: { jsHeapMaxBytes: 200_000_000, jsHeapMaxLabel: '200 MB' },
        }),
      },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    )).scenarios[0];

    assert.equal(scenario.isRegression, true);
    assert.equal(scenario.baselineIncomplete, true);
    assert.equal(scenario.notAssessed, false);
  });
});

describe('buildHtmlReport -- baseline provenance', () => {
  test('flags a self-comparison so it is not described as a develop baseline', () => {
    const html = buildHtmlReport(
      { sorting: currentScenario() },
      { timestamp: 'now', isSelfCompare: true, scenarios: { sorting: goldenScenario() } },
      {}
    );

    assert.equal(payloadOf(html).baseline.isSelfCompare, true);
  });

  test('does not flag a real single-run golden', () => {
    const html = buildHtmlReport(
      { sorting: currentScenario() },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    );

    assert.equal(payloadOf(html).baseline.isSelfCompare, false);
  });

  test('serializes the thresholds so the client bands cannot drift from the callouts', () => {
    const html = buildHtmlReport(
      { sorting: currentScenario() },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    );
    const { thresholds } = payloadOf(html);

    assert.ok(thresholds.heap < thresholds.timing);
    assert.equal(typeof thresholds.cvWarning, 'number');
  });
});

describe('buildHtmlReport -- trace window row', () => {
  test('is marked informational so it is never coloured as a verdict', () => {
    // After the measurement fix this row is harness wall clock: on the scroll scenarios it is 500
    // sequential wheel round trips and does not move with grid work.
    const html = buildHtmlReport(
      { sorting: currentScenario() },
      { timestamp: 't', scenarios: { sorting: goldenScenario() } },
      {}
    );
    const row = payloadOf(html).scenarios[0].detailedMetrics.find(r => r.key === 'trace-window');

    assert.equal(row.neutral, true);
    assert.equal(row.note, 'harness wall clock');
  });
});
