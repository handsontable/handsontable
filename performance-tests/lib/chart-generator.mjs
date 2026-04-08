// Mermaid xychart-beta chart generation for performance comparison.

/**
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

// --- internals ---

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

function buildMermaidChart(scenarioName, metrics) {
  const labels = metrics.map(m => `"${m.label}"`).join(', ');
  const goldenValues = metrics.map(m => m.golden).join(', ');
  const currentValues = metrics.map(m => m.current).join(', ');

  return [
    '```mermaid',
    'xychart-beta horizontal',
    `  title "${scenarioName} (ms)"`,
    `  x-axis [${labels}]`,
    `  bar "Baseline" [${goldenValues}]`,
    `  bar "Current" [${currentValues}]`,
    '```',
  ].join('\n');
}

function round(v) {
  return v != null && Number.isFinite(v) ? Math.round(v) : 0;
}
