/**
 * Markdown report assembly -- builds the full performance comparison report.
 */

import { generateChart, generateNoBaselineSummary } from './chart-generator.mjs';

/**
 * Build a full markdown performance report.
 *
 * @param {Record<string, object>} allScenarioResults -- keyed by scenario name, each with averaged trace data
 * @param {object | null} goldenSnapshots -- golden baseline (or null if unavailable)
 * @returns {string} full markdown report
 */
export function buildReport(allScenarioResults, goldenSnapshots) {
  const goldenScenarios = goldenSnapshots?.scenarios || {};
  const sections = [];

  sections.push('## Performance tests results\n');

  for (const [name, current] of Object.entries(allScenarioResults)) {
    const golden = goldenScenarios[name];
    const title = formatTitle(name);

    sections.push(`### ${title}`);

    if (golden) {
      // Comparison mode
      const chartBlock = generateChart(title, golden, current);

      sections.push(chartBlock);

      // Hook timing line (filtering/sorting)
      if (golden.hookTiming != null && current.hookTiming != null) {
        const pct = pctChange(golden.hookTiming, current.hookTiming);
        const pctStr = pct != null ? ` (${fmtPct(pct)})` : '';

        const gHook = Math.round(golden.hookTiming);
        const cHook = Math.round(current.hookTiming);

        sections.push(`> Hook timing: ${gHook} ms → ${cHook} ms${pctStr}`);
      }

      // Details table
      sections.push(buildDetailsTable(name, golden, current));
    } else {
      // No baseline mode
      sections.push(generateNoBaselineSummary(title, current));

      if (current.hookTiming != null) {
        sections.push(`> Hook timing: ${Math.round(current.hookTiming)} ms`);
      }

      sections.push(buildRawMetricsTable(name, current));
    }

    sections.push('');
  }

  return sections.join('\n');
}

// --- details table with golden comparison ---

/**
 * @param name
 * @param golden
 * @param current
 */
function buildDetailsTable(name, golden, current) {
  const rows = [];
  const gCats = golden.categories || {};
  const cCats = current.categories || {};
  const allKeys = new Set([...Object.keys(gCats), ...Object.keys(cCats)]);

  for (const key of ['scripting', 'rendering', 'painting', 'loading', 'other', 'experience', 'idle']) {
    if (!allKeys.has(key)) { continue; }

    const g = gCats[key];
    const c = cCats[key];

    rows.push({
      label: categoryLabel(key),
      golden: fmtMs(g),
      current: fmtMs(c),
      change: fmtPct(pctChange(g, c)),
      cv: fmtCv(current._iterationValues?.categories?.[key]),
    });
  }

  // Cumulative (rangeEnd)
  rows.push({
    label: 'Cumulative',
    golden: fmtMs(golden.rangeEnd),
    current: fmtMs(current.rangeEnd),
    change: fmtPct(pctChange(golden.rangeEnd, current.rangeEnd)),
    cv: fmtCv(current._iterationValues?.rangeEnd),
  });

  // UpdateCounters if present
  const gUc = golden.updateCounters;
  const cUc = current.updateCounters;

  if (gUc && cUc) {
    rows.push(...buildUpdateCounterRows(gUc, cUc));
  }

  return wrapDetails('All metrics', formatMarkdownTable(
    ['Metric', 'Golden', 'Current', 'Change', 'CV%'],
    rows.map(r => [r.label, r.golden, r.current, r.change, r.cv]),
  ));
}

// --- raw metrics table (no golden) ---

/**
 * @param name
 * @param current
 */
function buildRawMetricsTable(name, current) {
  const rows = [];
  const cCats = current.categories || {};

  for (const key of ['scripting', 'rendering', 'painting', 'loading', 'other', 'experience', 'idle']) {
    if (cCats[key] == null) { continue; }

    rows.push({
      label: categoryLabel(key),
      value: fmtMs(cCats[key]),
      cv: fmtCv(current._iterationValues?.categories?.[key]),
    });
  }

  rows.push({
    label: 'Cumulative',
    value: fmtMs(current.rangeEnd),
    cv: fmtCv(current._iterationValues?.rangeEnd),
  });

  const cUc = current.updateCounters;

  if (cUc) {
    if (cUc.jsHeapMinLabel) { rows.push({ label: 'Min JS heap', value: cUc.jsHeapMinLabel, cv: '' }); }
    if (cUc.jsHeapMaxLabel) { rows.push({ label: 'Max JS heap', value: cUc.jsHeapMaxLabel, cv: '' }); }
    if (cUc.nodesMin != null) { rows.push({ label: 'Min Nodes', value: String(cUc.nodesMin), cv: '' }); }
    if (cUc.nodesMax != null) { rows.push({ label: 'Max Nodes', value: String(cUc.nodesMax), cv: '' }); }
  }

  return wrapDetails('All metrics', formatMarkdownTable(
    ['Metric', 'Value', 'CV%'],
    rows.map(r => [r.label, r.value, r.cv]),
  ));
}

// --- UpdateCounters rows ---

/**
 * @param golden
 * @param current
 */
function buildUpdateCounterRows(golden, current) {
  const rows = [];
  const pairs = [
    ['Min JS heap', 'jsHeapMinLabel', 'jsHeapMinBytes'],
    ['Max JS heap', 'jsHeapMaxLabel', 'jsHeapMaxBytes'],
    ['Min Nodes', 'nodesMin', 'nodesMin'],
    ['Max Nodes', 'nodesMax', 'nodesMax'],
    ['Min Listeners', 'listenersMin', 'listenersMin'],
    ['Max Listeners', 'listenersMax', 'listenersMax'],
  ];

  for (const [label, displayKey, numKey] of pairs) {
    const gDisplay = golden[displayKey];
    const cDisplay = current[displayKey];

    if (gDisplay == null && cDisplay == null) { continue; }

    rows.push({
      label,
      golden: gDisplay != null ? String(gDisplay) : '--',
      current: cDisplay != null ? String(cDisplay) : '--',
      change: fmtPct(pctChange(golden[numKey], current[numKey])),
      cv: '',
    });
  }

  return rows;
}

// --- formatting helpers ---

/**
 * @param name
 */
function formatTitle(name) {
  return name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * @param key
 */
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

/**
 * @param v
 */
function fmtMs(v) {
  if (v == null || !Number.isFinite(v)) { return '--'; }

  return `${Math.round(v)} ms`;
}

/**
 * @param pct
 */
function fmtPct(pct) {
  if (pct == null) { return '--'; }

  const sign = pct >= 0 ? '+' : '';

  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Compute CV% (coefficient of variation) from an array of per-iteration values.
 *
 * @param values
 */
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

/**
 * @param baseline
 * @param current
 */
function pctChange(baseline, current) {
  if (baseline == null || current == null || baseline === 0) { return null; }

  return ((current - baseline) / baseline) * 100;
}

/**
 * @param headers
 * @param rows
 */
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

/**
 * @param summary
 * @param content
 */
function wrapDetails(summary, content) {
  return `\n<details><summary>${summary}</summary>\n\n${content}\n\n</details>`;
}
