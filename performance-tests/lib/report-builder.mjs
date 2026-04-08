// Markdown report assembly -- builds the performance comparison report.

import { generateChart } from './chart-generator.mjs';

/**
 * @param {Record<string, object>} allScenarioResults -- keyed by scenario name
 * @param {object | null} goldenSnapshots -- golden baseline (or null to self-compare)
 * @returns {string} full markdown report
 */
export function buildReport(allScenarioResults, goldenSnapshots) {
  const goldenScenarios = goldenSnapshots?.scenarios || {};
  const hasGolden = Object.keys(goldenScenarios).length > 0;
  const sections = [];

  // Summary table at the top
  sections.push(buildSummaryTable(allScenarioResults, goldenScenarios, hasGolden));

  // Per-scenario details (each collapsed)
  for (const [name, current] of Object.entries(allScenarioResults)) {
    const golden = goldenScenarios[name] || current;
    const title = formatTitle(name);

    const scenarioSections = [];

    // Chart
    scenarioSections.push(generateChart(title, golden, current));

    // Hook timing
    if (current.hookTiming != null) {
      if (hasGolden && golden.hookTiming != null) {
        const pct = pctChange(golden.hookTiming, current.hookTiming);
        const pctStr = pct != null ? ` (${fmtPctWithEmoji(pct)})` : '';
        const gHook = Math.round(golden.hookTiming);
        const cHook = Math.round(current.hookTiming);

        scenarioSections.push(`> Hook timing: ${gHook} ms -> ${cHook} ms${pctStr}`);
      } else {
        scenarioSections.push(`> Hook timing: ${Math.round(current.hookTiming)} ms`);
      }
    }

    // Metrics table
    scenarioSections.push(buildDetailsTable(golden, current, hasGolden));

    sections.push(wrapDetails(
      `<strong>${title}</strong>`,
      scenarioSections.join('\n'),
    ));
  }

  return sections.join('\n');
}

// --- summary table ---

function buildSummaryTable(results, goldenScenarios, hasGolden) {
  const headers = hasGolden
    ? ['Scenario', 'Scripting', 'Rendering', 'Painting', 'Total', 'Change']
    : ['Scenario', 'Scripting', 'Rendering', 'Painting', 'Total'];

  const rows = [];

  for (const [name, current] of Object.entries(results)) {
    const title = formatTitle(name);
    const cats = current.categories || {};
    const total = sumActive(cats);

    if (hasGolden) {
      const golden = goldenScenarios[name];
      const goldenTotal = golden ? sumActive(golden.categories || {}) : null;
      const change = fmtPctWithEmoji(pctChange(goldenTotal, total));

      rows.push([title, fmtMs(cats.scripting), fmtMs(cats.rendering), fmtMs(cats.painting), fmtMs(total), change]);
    } else {
      rows.push([title, fmtMs(cats.scripting), fmtMs(cats.rendering), fmtMs(cats.painting), fmtMs(total)]);
    }
  }

  return formatMarkdownTable(headers, rows);
}

// --- details table ---

function buildDetailsTable(golden, current, hasGolden) {
  const rows = [];
  const gCats = golden.categories || {};
  const cCats = current.categories || {};
  const allKeys = new Set([...Object.keys(gCats), ...Object.keys(cCats)]);

  for (const key of ['scripting', 'rendering', 'painting', 'loading', 'other', 'experience', 'idle']) {
    if (!allKeys.has(key)) { continue; }

    const g = gCats[key];
    const c = cCats[key];

    rows.push([
      categoryLabel(key),
      hasGolden ? fmtMs(g) : '',
      fmtMs(c),
      hasGolden ? fmtPctWithEmoji(pctChange(g, c)) : '',
      fmtCv(current._iterationValues?.categories?.[key]),
    ]);
  }

  // Total active time (scripting + rendering + painting)
  const gTotal = sumActive(gCats);
  const cTotal = sumActive(cCats);

  rows.push([
    '**Total active**',
    hasGolden ? fmtMs(gTotal) : '',
    fmtMs(cTotal),
    hasGolden ? fmtPctWithEmoji(pctChange(gTotal, cTotal)) : '',
    '',
  ]);

  // Range end (full trace window including idle)
  rows.push([
    'Trace window',
    hasGolden ? fmtMs(golden.rangeEnd) : '',
    fmtMs(current.rangeEnd),
    hasGolden ? fmtPctWithEmoji(pctChange(golden.rangeEnd, current.rangeEnd)) : '',
    fmtCv(current._iterationValues?.rangeEnd),
  ]);

  // UpdateCounters
  const gUc = golden.updateCounters;
  const cUc = current.updateCounters;

  if (cUc) {
    const ucPairs = [
      ['Min JS heap', 'jsHeapMinLabel', 'jsHeapMinBytes'],
      ['Max JS heap', 'jsHeapMaxLabel', 'jsHeapMaxBytes'],
      ['Min Nodes', 'nodesMin', 'nodesMin'],
      ['Max Nodes', 'nodesMax', 'nodesMax'],
      ['Min Listeners', 'listenersMin', 'listenersMin'],
      ['Max Listeners', 'listenersMax', 'listenersMax'],
    ];

    for (const [label, displayKey, numKey] of ucPairs) {
      const gDisplay = gUc?.[displayKey];
      const cDisplay = cUc[displayKey];

      if (gDisplay == null && cDisplay == null) { continue; }

      rows.push([
        label,
        hasGolden && gDisplay != null ? String(gDisplay) : '',
        cDisplay != null ? String(cDisplay) : '--',
        hasGolden ? fmtPctWithEmoji(pctChange(gUc?.[numKey], cUc[numKey])) : '',
        '',
      ]);
    }
  }

  if (!hasGolden) {
    const filteredHeaders = ['Metric', 'Value', 'CV%'];
    const filteredRows = rows.map(r => [r[0], r[2], r[4]]);

    return formatMarkdownTable(filteredHeaders, filteredRows);
  }

  return formatMarkdownTable(['Metric', 'Baseline', 'Current', 'Change', 'CV%'], rows);
}

// --- formatting helpers ---

function sumActive(categories) {
  return (categories.scripting || 0) + (categories.rendering || 0) + (categories.painting || 0);
}

function formatTitle(name) {
  return name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function categoryLabel(key) {
  const labels = {
    scripting: 'Scripting',
    rendering: 'Rendering',
    painting: 'Painting',
    loading: 'Loading',
    other: 'System',
    experience: 'Experience',
    idle: 'Idle',
  };

  return labels[key] || key;
}

function fmtMs(v) {
  if (v == null || !Number.isFinite(v)) { return '--'; }

  return `${Math.round(v)} ms`;
}

function fmtPctWithEmoji(pct) {
  if (pct == null) { return '--'; }

  const sign = pct >= 0 ? '+' : '';
  const text = `${sign}${pct.toFixed(1)}%`;

  if (Math.abs(pct) < 1) { return `${text}`; }
  if (pct > 10) { return `${text} \u{1F534}`; } // red circle -- significant regression
  if (pct > 0) { return `${text} \u{1F7E1}`; } // yellow circle -- minor regression
  if (pct < -10) { return `${text} \u{1F7E2}`; } // green circle -- significant improvement
  if (pct < 0) { return `${text} \u{1F535}`; } // blue circle -- minor improvement

  return text;
}

function pctChange(baseline, current) {
  if (baseline == null || current == null || baseline === 0) { return null; }

  return ((current - baseline) / baseline) * 100;
}

function fmtCv(values) {
  if (!values || values.length < 2) { return ''; }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  if (mean === 0) { return ''; }

  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  const cv = (stddev / Math.abs(mean)) * 100;
  const warning = cv > 15 ? ' !!!' : '';

  return `${cv.toFixed(1)}%${warning}`;
}

function formatMarkdownTable(headers, rows) {
  const allRows = [headers, ...rows];
  const colWidths = headers.map((_, i) =>
    Math.max(...allRows.map(r => String(r[i] || '').length))
  );

  const pad = (s, w) => String(s || '').padEnd(w);
  const headerLine = `| ${headers.map((h, i) => pad(h, colWidths[i])).join(' | ')} |`;
  const sepLine = `| ${colWidths.map(w => '-'.repeat(w)).join(' | ')} |`;
  const dataLines = rows.map(
    r => `| ${r.map((c, i) => pad(c, colWidths[i])).join(' | ')} |`
  );

  return [headerLine, sepLine, ...dataLines].join('\n');
}

function wrapDetails(summary, content) {
  return `\n<details><summary>${summary}</summary>\n\n${content}\n\n</details>\n`;
}
