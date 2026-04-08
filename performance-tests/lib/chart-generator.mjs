/**
 * Mermaid xychart-beta chart generation for performance comparison.
 */

/**
 * Generate a Mermaid xychart comparing golden vs current metrics.
 *
 * @param {string} scenarioName
 * @param {object} goldenMetrics -- { categories, rangeEnd }
 * @param {object} currentMetrics -- { categories, rangeEnd }
 * @returns {string} markdown with Mermaid code block
 */
export function generateChart(scenarioName, goldenMetrics, currentMetrics) {
  const metrics = buildPrimaryMetrics(goldenMetrics, currentMetrics);
  const summary = buildSummaryLine(metrics);
  const chart = buildMermaidChart(scenarioName, metrics);

  return `${summary}\n\n${chart}`;
}

/**
 * Generate a summary-only line (no chart) for scenarios without a golden baseline.
 *
 * @param {string} scenarioName
 * @param {object} currentMetrics
 * @returns {string}
 */
export function generateNoBaselineSummary(scenarioName, currentMetrics) {
  const cats = currentMetrics.categories || {};
  const lines = [
    `JS Execution: ${round(cats.scripting)} ms`,
    `Rendering: ${round(cats.rendering)} ms`,
    `Painting: ${round(cats.painting)} ms`,
    `Cumulative: ${round(currentMetrics.rangeEnd)} ms`,
  ];

  return `> No baseline available. Current: ${lines.join(', ')}`;
}

// --- internals ---

/**
 * @param golden
 * @param current
 */
function buildPrimaryMetrics(golden, current) {
  const gCats = golden.categories || {};
  const cCats = current.categories || {};

  return [
    {
      label: 'JS Execution',
      golden: round(gCats.scripting),
      current: round(cCats.scripting),
    },
    {
      label: 'Rendering',
      golden: round(gCats.rendering),
      current: round(cCats.rendering),
    },
    {
      label: 'Painting',
      golden: round(gCats.painting),
      current: round(cCats.painting),
    },
    {
      label: 'Cumulative',
      golden: round(golden.rangeEnd),
      current: round(current.rangeEnd),
    },
  ];
}

/**
 * @param metrics
 */
function buildSummaryLine(metrics) {
  const parts = metrics.map((m) => {
    if (m.golden === 0 || m.golden == null) {
      return `${m.label}: ${m.current} ms`;
    }

    const pct = ((m.current - m.golden) / m.golden) * 100;
    const sign = pct >= 0 ? '+' : '';
    const direction = pct >= 0 ? 'slower' : 'faster';

    return `${m.label} ${sign}${pct.toFixed(1)}% ${direction}`;
  });

  return `> ${parts.join(', ')}`;
}

/**
 * @param scenarioName
 * @param metrics
 */
function buildMermaidChart(scenarioName, metrics) {
  const labels = metrics.map(m => `"${m.label}"`).join(', ');
  const goldenValues = metrics.map(m => m.golden).join(', ');
  const currentValues = metrics.map(m => m.current).join(', ');

  return [
    '```mermaid',
    'xychart-beta horizontal',
    `  title "${scenarioName} - Primary Metrics (ms)"`,
    `  x-axis [${labels}]`,
    `  bar "Golden (develop)" [${goldenValues}]`,
    `  bar "Current (PR)" [${currentValues}]`,
    '```',
  ].join('\n');
}

/**
 * @param v
 */
function round(v) {
  return v != null && Number.isFinite(v) ? Math.round(v) : 0;
}
