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
    const chartBlock = generateChart(title, golden, current);

    scenarioSections.push(chartBlock);

    // Hook timing
    if (current.hookTiming != null) {
      if (hasGolden && golden.hookTiming != null) {
        const pct = pctChange(golden.hookTiming, current.hookTiming);
        const pctStr = pct != null ? ` (${fmtPct(pct)})` : '';
        const gHook = Math.round(golden.hookTiming);
        const cHook = Math.round(current.hookTiming);

        scenarioSections.push(`> Hook timing: ${gHook} ms → ${cHook} ms${pctStr}`);
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
    ? ['Scenario', 'Scripting', 'Rendering', 'Painting', 'Cumulative', 'Change']
    : ['Scenario', 'Scripting', 'Rendering', 'Painting', 'Cumulative'];

  const rows = [];

  for (const [name, current] of Object.entries(results)) {
    const title = formatTitle(name);
    const cats = current.categories || {};

    if (hasGolden) {
      const golden = goldenScenarios[name];
      const cumChange = golden ? fmtPct(pctChange(golden.rangeEnd, current.rangeEnd)) : '--';

      rows.push([
        title,
        fmtMs(cats.scripting),
        fmtMs(cats.rendering),
        fmtMs(cats.painting),
        fmtMs(current.rangeEnd),
        cumChange,
      ]);
    } else {
      rows.push([
        title,
        fmtMs(cats.scripting),
        fmtMs(cats.rendering),
        fmtMs(cats.painting),
        fmtMs(current.rangeEnd),
      ]);
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
      hasGolden ? fmtPct(pctChange(g, c)) : '',
      fmtCv(current._iterationValues?.categories?.[key]),
    ]);
  }

  // Cumulative
  rows.push([
    'Cumulative',
    hasGolden ? fmtMs(golden.rangeEnd) : '',
    fmtMs(current.rangeEnd),
    hasGolden ? fmtPct(pctChange(golden.rangeEnd, current.rangeEnd)) : '',
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
        hasGolden ? fmtPct(pctChange(gUc?.[numKey], cUc[numKey])) : '',
        '',
      ]);
    }
  }

  const headers = hasGolden
    ? ['Metric', 'Golden', 'Current', 'Change', 'CV%']
    : ['Metric', '', 'Value', '', 'CV%'];

  // Filter out empty columns when no golden
  if (!hasGolden) {
    const filteredHeaders = ['Metric', 'Value', 'CV%'];
    const filteredRows = rows.map(r => [r[0], r[2], r[4]]);

    return formatMarkdownTable(filteredHeaders, filteredRows);
  }

  return formatMarkdownTable(headers, rows);
}

// --- formatting helpers ---

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

function fmtPct(pct) {
  if (pct == null) { return '--'; }

  const sign = pct >= 0 ? '+' : '';

  return `${sign}${pct.toFixed(1)}%`;
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

function pctChange(baseline, current) {
  if (baseline == null || current == null || baseline === 0) { return null; }

  return ((current - baseline) / baseline) * 100;
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
