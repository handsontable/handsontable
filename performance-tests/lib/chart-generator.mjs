// Inline SVG horizontal bar chart for performance comparison.
// Renders as an <img> tag with a data URI so it works in GitHub markdown
// and always shows both Baseline and Current bars side by side.

const COLORS = {
  baseline: '#6c8ebf',
  current: '#d4a03c',
};
const BAR_HEIGHT = 18;
const BAR_GAP = 4;
const GROUP_GAP = 20;
const LABEL_WIDTH = 110;
const VALUE_MARGIN = 6;
const CHART_WIDTH = 600;
const FONT = 'font-family="ui-monospace,SFMono-Regular,SF Mono,Menlo,monospace"';

/**
 * @param {string} scenarioName
 * @param {object} goldenMetrics -- { categories, rangeEnd }
 * @param {object} currentMetrics -- { categories, rangeEnd }
 * @returns {string} markdown with inline SVG image
 */
export function generateChart(scenarioName, goldenMetrics, currentMetrics) {
  const metrics = buildPrimaryMetrics(goldenMetrics, currentMetrics);
  const summary = buildSummaryLine(metrics);
  const svg = buildSvgChart(scenarioName, metrics);

  return `${summary}\n\n${svg}`;
}

// --- internals ---

function buildPrimaryMetrics(golden, current) {
  const gCats = golden.categories || {};
  const cCats = current.categories || {};

  return [
    { label: 'JS Execution', golden: round(gCats.scripting), current: round(cCats.scripting) },
    { label: 'Rendering', golden: round(gCats.rendering), current: round(cCats.rendering) },
    { label: 'Painting', golden: round(gCats.painting), current: round(cCats.painting) },
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

function buildSvgChart(title, metrics) {
  const maxVal = Math.max(...metrics.flatMap(m => [m.golden, m.current]), 1);
  const barAreaWidth = CHART_WIDTH - LABEL_WIDTH - 80;

  const groupHeight = BAR_HEIGHT * 2 + BAR_GAP;
  const totalHeight = metrics.length * (groupHeight + GROUP_GAP) + 40;

  const bars = [];
  let y = 30;

  for (const m of metrics) {
    const gWidth = Math.max(1, (m.golden / maxVal) * barAreaWidth);
    const cWidth = Math.max(1, (m.current / maxVal) * barAreaWidth);

    // Label
    bars.push(`<text x="${LABEL_WIDTH - 8}" y="${y + BAR_HEIGHT - 2}" `
      + `text-anchor="end" ${FONT} font-size="12" fill="#333">${esc(m.label)}</text>`);

    // Baseline bar
    bars.push(`<rect x="${LABEL_WIDTH}" y="${y}" width="${gWidth}" `
      + `height="${BAR_HEIGHT}" rx="2" fill="${COLORS.baseline}" />`);
    bars.push(`<text x="${LABEL_WIDTH + gWidth + VALUE_MARGIN}" y="${y + BAR_HEIGHT - 4}" `
      + `${FONT} font-size="11" fill="#666">${m.golden} ms</text>`);

    // Current bar
    const cy = y + BAR_HEIGHT + BAR_GAP;

    bars.push(`<rect x="${LABEL_WIDTH}" y="${cy}" width="${cWidth}" `
      + `height="${BAR_HEIGHT}" rx="2" fill="${COLORS.current}" />`);
    bars.push(`<text x="${LABEL_WIDTH + cWidth + VALUE_MARGIN}" y="${cy + BAR_HEIGHT - 4}" `
      + `${FONT} font-size="11" fill="#666">${m.current} ms</text>`);

    y += groupHeight + GROUP_GAP;
  }

  // Legend
  const legendY = 12;
  const legend = [
    `<rect x="${LABEL_WIDTH}" y="${legendY - 9}" width="10" height="10" rx="1" fill="${COLORS.baseline}" />`,
    `<text x="${LABEL_WIDTH + 14}" y="${legendY}" ${FONT} font-size="11" fill="#666">Baseline (develop)</text>`,
    `<rect x="${LABEL_WIDTH + 140}" y="${legendY - 9}" width="10" height="10" rx="1" fill="${COLORS.current}" />`,
    `<text x="${LABEL_WIDTH + 154}" y="${legendY}" ${FONT} font-size="11" fill="#666">Current (PR)</text>`,
  ];

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART_WIDTH}" height="${totalHeight}" `
      + `viewBox="0 0 ${CHART_WIDTH} ${totalHeight}">`,
    ...legend,
    ...bars,
    '</svg>',
  ].join('\n');

  // Encode as data URI inside an <img> tag (works in GitHub markdown)
  const encoded = Buffer.from(svg).toString('base64');

  return `<img src="data:image/svg+xml;base64,${encoded}" alt="${esc(title)}" />`;
}

function round(v) {
  return v != null && Number.isFinite(v) ? Math.round(v) : 0;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
