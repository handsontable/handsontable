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
