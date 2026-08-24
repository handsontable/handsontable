// Self-contained interactive HTML performance report.
// Produces a single HTML file with inline CSS + JS -- zero external requests.
// GitHub-native (Primer-inspired) design, vanilla JS for interactivity.

import {
  REGRESSION_CALLOUT_THRESHOLD,
  classifyChange,
  pctChange,
  sumActive,
  formatTitle,
} from './thresholds.mjs';

/**
 * @param {Record<string, object>} scenarioResults -- keyed by scenario name
 * @param {object | null} goldenSnapshots -- golden baseline
 * @param {object} [meta] -- { prNumber, branch, baseBranch, pagesUrl }
 * @returns {string} self-contained HTML document
 */
export function buildHtmlReport(scenarioResults, goldenSnapshots, meta = {}) {
  const goldenScenarios = goldenSnapshots?.scenarios || {};
  const hasGolden = Object.keys(goldenScenarios).length > 0;

  // Build data payload for client-side rendering
  const payload = buildPayload(scenarioResults, goldenScenarios, hasGolden, meta);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Performance Report${meta.prNumber ? ` - PR #${meta.prNumber}` : ''}</title>
${buildStyles()}
</head>
<body>
<div id="app"></div>
<script>
window.__PERF_DATA__ = ${JSON.stringify(payload)};
</script>
${buildScript()}
</body>
</html>`;
}

// --- data payload ---

function buildPayload(scenarioResults, goldenScenarios, hasGolden, meta) {
  const scenarios = [];

  for (const [name, current] of Object.entries(scenarioResults)) {
    const golden = goldenScenarios[name] || null;
    const cCats = current.categories || {};
    const gCats = golden?.categories || {};
    const currentTotal = sumActive(cCats);
    const goldenTotal = golden ? sumActive(gCats) : null;
    const totalChange = pctChange(goldenTotal, currentTotal);
    const heap = buildHeapChartData(current, golden);
    const timingRegressed = totalChange != null && totalChange > REGRESSION_CALLOUT_THRESHOLD;
    const heapRegressed = heap?.change != null && heap.change > REGRESSION_CALLOUT_THRESHOLD;
    const isRegression = timingRegressed || heapRegressed;
    let { status } = classifyChange(totalChange);

    // A JS-heap regression counts even when trace timing is flat, matching the markdown callouts.
    if (heapRegressed) {
      status = 'regression';
    }

    // The header badge shows whichever metric drives the status. For a heap-only regression the
    // timing percentage would contradict the regression styling, so show the heap change instead.
    const badgeIsHeap = heapRegressed && !timingRegressed;
    const badgeChange = badgeIsHeap ? heap.change : totalChange;

    scenarios.push({
      name,
      title: formatTitle(name),
      status,
      hasBaseline: !!golden,
      totalChange,
      badgeChange,
      badgeIsHeap,
      isRegression,
      metrics: {
        scripting: {
          current: cCats.scripting || 0,
          baseline: gCats.scripting || 0,
          change: pctChange(gCats.scripting, cCats.scripting),
        },
        rendering: {
          current: cCats.rendering || 0,
          baseline: gCats.rendering || 0,
          change: pctChange(gCats.rendering, cCats.rendering),
        },
        painting: {
          current: cCats.painting || 0,
          baseline: gCats.painting || 0,
          change: pctChange(gCats.painting, cCats.painting),
        },
        total: { current: currentTotal, baseline: goldenTotal || 0, change: totalChange },
      },
      detailedMetrics: buildDetailedMetrics(current, golden),
      memory: buildMemoryMetrics(current, golden),
      hookTiming: buildHookTiming(current, golden),
      heap,
      cv: {
        scripting: calcCv(current._iterationValues?.categories?.scripting),
        rendering: calcCv(current._iterationValues?.categories?.rendering),
        painting: calcCv(current._iterationValues?.categories?.painting),
      },
      runs: current.runs || 3,
    });
  }

  const regressions = scenarios.filter(s => s.isRegression).length;
  const improvements = scenarios.filter(s => s.status === 'improvement').length;

  return {
    meta: {
      prNumber: meta.prNumber || null,
      branch: meta.branch || 'unknown',
      baseBranch: meta.baseBranch || 'develop',
      pagesUrl: meta.pagesUrl || null,
      generatedAt: new Date().toISOString(),
    },
    summary: {
      total: scenarios.length,
      regressions,
      improvements,
      neutral: scenarios.length - regressions - improvements,
    },
    hasBaseline: hasGolden,
    scenarios,
  };
}

function buildDetailedMetrics(current, golden) {
  const rows = [];
  const cCats = current.categories || {};
  const gCats = golden?.categories || {};

  for (const key of ['scripting', 'rendering', 'painting', 'loading', 'other', 'experience', 'idle']) {
    const c = cCats[key];
    const g = gCats?.[key];

    if (c == null && g == null) {
      continue;
    }

    rows.push({
      label: categoryLabel(key),
      key,
      current: c ?? 0,
      baseline: g ?? 0,
      change: pctChange(g, c),
      cv: calcCv(current._iterationValues?.categories?.[key]),
    });
  }

  // Total active
  const gTotal = golden ? sumActive(gCats) : 0;
  const cTotal = sumActive(cCats);

  rows.push({
    label: 'Total active',
    key: 'total-active',
    current: cTotal,
    baseline: gTotal,
    change: pctChange(gTotal, cTotal),
    cv: null,
    isBold: true,
  });

  // Trace window
  rows.push({
    label: 'Trace window',
    key: 'trace-window',
    current: current.rangeEnd || 0,
    baseline: golden?.rangeEnd || 0,
    change: pctChange(golden?.rangeEnd, current.rangeEnd),
    cv: calcCv(current._iterationValues?.rangeEnd),
  });

  return rows;
}

function buildMemoryMetrics(current, golden) {
  const cUc = current.updateCounters;
  const gUc = golden?.updateCounters;

  if (!cUc) {
    return [];
  }

  const pairs = [
    ['Min JS heap', 'jsHeapMinLabel', 'jsHeapMinBytes'],
    ['Max JS heap', 'jsHeapMaxLabel', 'jsHeapMaxBytes'],
    ['Min Nodes', 'nodesMin', 'nodesMin'],
    ['Max Nodes', 'nodesMax', 'nodesMax'],
    ['Min Listeners', 'listenersMin', 'listenersMin'],
    ['Max Listeners', 'listenersMax', 'listenersMax'],
  ];

  const rows = [];

  for (const [label, displayKey, numKey] of pairs) {
    const cDisplay = cUc[displayKey];
    const gDisplay = gUc?.[displayKey];

    if (cDisplay == null && gDisplay == null) {
      continue;
    }

    rows.push({
      label,
      currentDisplay: cDisplay != null ? String(cDisplay) : '--',
      baselineDisplay: gDisplay != null ? String(gDisplay) : '--',
      change: pctChange(gUc?.[numKey], cUc[numKey]),
    });
  }

  return rows;
}

function buildHookTiming(current, golden) {
  if (current.hookTiming == null) {
    return null;
  }

  return {
    current: current.hookTiming,
    baseline: golden?.hookTiming ?? null,
    change: golden?.hookTiming != null ? pctChange(golden.hookTiming, current.hookTiming) : null,
  };
}

function buildHeapChartData(current, golden) {
  const cur = current.updateCounters?.jsHeapMaxBytes;

  if (cur == null) {
    return null;
  }

  const baseline = golden?.updateCounters?.jsHeapMaxBytes ?? null;

  return {
    current: cur,
    baseline,
    change: baseline != null ? pctChange(baseline, cur) : null,
  };
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

function calcCv(values) {
  if (!values || values.length < 2) {
    return null;
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  if (mean === 0) {
    return null;
  }

  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;

  return (Math.sqrt(variance) / Math.abs(mean)) * 100;
}

// --- CSS ---

function buildStyles() {
  return `<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2328;
  background: #ffffff;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

a { color: #0969da; text-decoration: none; }
a:hover { text-decoration: underline; }

/* Header */
.report-header {
  border-bottom: 1px solid #d0d7de;
  padding-bottom: 16px;
  margin-bottom: 24px;
}
.report-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}
.report-header .meta {
  color: #656d76;
  font-size: 13px;
}

/* Dashboard counters */
.dashboard {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.counter-card {
  flex: 1;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 12px 16px;
  text-align: center;
}
.counter-card .count {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}
.counter-card .label {
  font-size: 12px;
  color: #656d76;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.counter-card.regression .count { color: #cf222e; }
.counter-card.improvement .count { color: #1a7f37; }
.counter-card.neutral .count { color: #656d76; }

/* Filter + sort bar */
.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filter-group, .sort-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.controls label {
  font-size: 12px;
  font-weight: 600;
  color: #656d76;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #f6f8fa;
  color: #1f2328;
  cursor: pointer;
  transition: background 0.1s;
}
.btn:hover { background: #eaeef2; }
.btn.active {
  background: #0969da;
  color: #ffffff;
  border-color: #0969da;
}

/* Scenario cards */
.scenario-card {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.scenario-card.regression { border-left: 3px solid #cf222e; }
.scenario-card.improvement { border-left: 3px solid #1a7f37; }
.scenario-card.neutral-up { border-left: 3px solid #bf8700; }
.scenario-card.neutral-down { border-left: 3px solid #0969da; }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  background: #f6f8fa;
}
.card-header:hover { background: #eaeef2; }
.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-header .arrow {
  display: inline-block;
  transition: transform 0.15s;
  font-size: 12px;
  color: #656d76;
}
.card-header .arrow.open { transform: rotate(90deg); }

/* Change badge */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.badge.regression { background: #ffebe9; color: #cf222e; }
.badge.improvement { background: #dafbe1; color: #1a7f37; }
.badge.neutral-up { background: #fff8c5; color: #bf8700; }
.badge.neutral-down { background: #ddf4ff; color: #0969da; }
.badge.neutral { background: #f6f8fa; color: #656d76; }
.badge.unknown { background: #f6f8fa; color: #656d76; }

/* Card body */
.card-body {
  padding: 16px;
  display: none;
  border-top: 1px solid #d0d7de;
}
.card-body.open { display: block; }

/* Quick metrics row */
.quick-metrics {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.quick-metric {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}
.quick-metric .metric-label {
  font-size: 11px;
  color: #656d76;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.quick-metric .metric-value {
  font-size: 18px;
  font-weight: 600;
}
.quick-metric .metric-change {
  font-size: 12px;
}

/* Chart area */
.chart-container {
  margin: 16px 0;
  overflow-x: auto;
}
.chart-container svg {
  display: block;
}

/* Expandable sections */
.expand-section {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  margin-top: 12px;
}
.expand-header {
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 600;
  color: #656d76;
  background: #f6f8fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.expand-header:hover { background: #eaeef2; }
.expand-header .arrow {
  display: inline-block;
  transition: transform 0.15s;
  font-size: 10px;
}
.expand-header .arrow.open { transform: rotate(90deg); }
.expand-body {
  display: none;
  padding: 12px;
}
.expand-body.open { display: block; }

/* Tables */
.metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.metrics-table th {
  text-align: left;
  padding: 6px 10px;
  font-weight: 600;
  border-bottom: 2px solid #d0d7de;
  color: #656d76;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
}
.metrics-table th:hover { color: #1f2328; }
.metrics-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #eaeef2;
}
.metrics-table tr:last-child td { border-bottom: none; }
.metrics-table .bold { font-weight: 600; }
.metrics-table .num { font-variant-numeric: tabular-nums; text-align: right; }
.metrics-table .cv-warn { color: #cf222e; font-weight: 600; }

/* Hook timing */
.hook-timing {
  font-size: 13px;
  color: #656d76;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f6f8fa;
  border-radius: 6px;
}

/* Tooltip */
.tooltip {
  position: fixed;
  background: #1f2328;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  display: none;
}

/* No results */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #656d76;
}
</style>`;
}

// --- Client-side JavaScript ---

function buildScript() {
  return `<script>
(function() {
  'use strict';

  const data = window.__PERF_DATA__;
  const app = document.getElementById('app');

  // --- State ---
  let filterMode = 'all';
  let sortKey = 'name';
  let sortAsc = true;

  // --- Tooltip (created once, outside render cycle) ---
  const tooltip = buildTooltip();
  document.body.appendChild(tooltip);

  // --- Render ---
  function render() {
    app.innerHTML = '';
    app.appendChild(buildHeader());
    app.appendChild(buildDashboard());
    app.appendChild(buildControls());
    app.appendChild(buildScenarioList());
  }

  function buildHeader() {
    const header = el('div', 'report-header');
    header.appendChild(elText('h1', '\\u26A1 Performance Report'));
    const parts = [];
    if (data.meta.prNumber) parts.push('PR #' + data.meta.prNumber);
    if (data.meta.branch !== 'unknown') parts.push(data.meta.branch + ' vs ' + data.meta.baseBranch);
    parts.push('Generated: ' + new Date(data.meta.generatedAt).toUTCString());
    header.appendChild(elText('div', parts.join(' \\u00B7 '), 'meta'));
    return header;
  }

  function buildDashboard() {
    const dash = el('div', 'dashboard');
    dash.appendChild(counterCard(data.summary.total, 'Total Scenarios', 'neutral'));
    dash.appendChild(counterCard(data.summary.regressions, 'Regressions', 'regression'));
    dash.appendChild(counterCard(data.summary.improvements, 'Improvements', 'improvement'));
    dash.appendChild(counterCard(data.summary.neutral, 'Neutral', 'neutral'));
    return dash;
  }

  function counterCard(count, label, cls) {
    const card = el('div', 'counter-card ' + cls);
    card.appendChild(elText('div', count, 'count'));
    card.appendChild(elText('div', label, 'label'));
    return card;
  }

  function buildControls() {
    const controls = el('div', 'controls');

    // Filter
    const filterGroup = el('div', 'filter-group');
    filterGroup.appendChild(elText('label', 'Filter:'));

    const filters = [
      ['all', 'All'],
      ['regression', 'Regressions'],
      ['improvement', 'Improvements'],
      ['neutral', 'Neutral'],
    ];

    for (const [mode, text] of filters) {
      const btn = elText('button', text, 'btn' + (filterMode === mode ? ' active' : ''));
      btn.dataset.filter = mode;
      btn.addEventListener('click', () => {
        filterMode = mode;
        render();
      });
      filterGroup.appendChild(btn);
    }

    controls.appendChild(filterGroup);

    // Sort
    const sortGroup = el('div', 'sort-group');
    sortGroup.appendChild(elText('label', 'Sort:'));

    const sorts = [
      ['name', 'Name'],
      ['total', 'Total'],
      ['change', 'Change %'],
    ];

    for (const [key, text] of sorts) {
      const arrow = sortKey === key ? (sortAsc ? ' \\u2191' : ' \\u2193') : '';
      const btn = elText('button', text + arrow, 'btn' + (sortKey === key ? ' active' : ''));
      btn.dataset.sort = key;
      btn.addEventListener('click', () => {
        if (sortKey === key) {
          sortAsc = !sortAsc;
        } else {
          sortKey = key;
          sortAsc = true;
        }
        render();
      });
      sortGroup.appendChild(btn);
    }

    controls.appendChild(sortGroup);
    return controls;
  }

  function buildScenarioList() {
    const list = el('div', 'scenario-list');
    let scenarios = getFilteredSorted();

    if (scenarios.length === 0) {
      const empty = el('div', 'empty-state');
      empty.textContent = 'No scenarios match the current filter.';
      list.appendChild(empty);
      return list;
    }

    for (const s of scenarios) {
      list.appendChild(buildScenarioCard(s));
    }

    return list;
  }

  function getFilteredSorted() {
    let list = [...data.scenarios];

    // Filter
    if (filterMode === 'regression') {
      list = list.filter(s => s.isRegression || s.status === 'regression');
    } else if (filterMode === 'improvement') {
      list = list.filter(s => s.status === 'improvement');
    } else if (filterMode === 'neutral') {
      list = list.filter(s => !s.isRegression && s.status !== 'regression' && s.status !== 'improvement');
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortKey === 'total') {
        cmp = a.metrics.total.current - b.metrics.total.current;
      } else if (sortKey === 'change') {
        cmp = (a.totalChange || 0) - (b.totalChange || 0);
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }

  function buildScenarioCard(scenario) {
    const card = el('div', 'scenario-card ' + scenario.status);
    const autoExpand = scenario.isRegression;

    // Header
    const header = el('div', 'card-header');
    const titleRow = el('h3');
    const arrow = elText('span', '\\u25B6', 'arrow' + (autoExpand ? ' open' : ''));
    titleRow.appendChild(arrow);
    titleRow.appendChild(document.createTextNode(scenario.title));
    header.appendChild(titleRow);

    const badgeText = fmtPct(scenario.badgeChange) + (scenario.badgeIsHeap ? ' heap' : '');
    const badge = elText('span', badgeText, 'badge ' + scenario.status);
    header.appendChild(badge);

    header.addEventListener('click', () => {
      const body = card.querySelector('.card-body');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });

    card.appendChild(header);

    // Body
    const body = el('div', 'card-body' + (autoExpand ? ' open' : ''));

    // Quick metrics
    body.appendChild(buildQuickMetrics(scenario));

    // Chart
    if (data.hasBaseline) {
      body.appendChild(buildChart(scenario));

      if (scenario.heap) {
        body.appendChild(buildHeapChart(scenario));
      }
    }

    // Hook timing
    if (scenario.hookTiming) {
      body.appendChild(buildHookTimingEl(scenario.hookTiming));
    }

    // Detailed metrics (expandable)
    body.appendChild(buildExpandSection('Detailed Metrics', () => buildMetricsTable(scenario), autoExpand));

    // Memory (expandable)
    if (scenario.memory && scenario.memory.length > 0) {
      body.appendChild(buildExpandSection('Memory & DOM', () => buildMemoryTable(scenario)));
    }

    card.appendChild(body);
    return card;
  }

  function buildQuickMetrics(scenario) {
    const row = el('div', 'quick-metrics');
    const keys = ['scripting', 'rendering', 'painting', 'total'];
    const labels = { scripting: 'Scripting', rendering: 'Rendering', painting: 'Painting', total: 'Total' };

    for (const key of keys) {
      const m = scenario.metrics[key];
      const item = el('div', 'quick-metric');
      item.appendChild(elText('span', labels[key], 'metric-label'));
      item.appendChild(elText('span', Math.round(m.current) + ' ms', 'metric-value'));
      if (data.hasBaseline && m.change != null) {
        const changeEl = elText('span', fmtPct(m.change), 'metric-change');
        const cls = classifyChangeCss(m.change);
        changeEl.style.color = statusColor(cls);
        item.appendChild(changeEl);
      }
      row.appendChild(item);
    }

    return row;
  }

  function buildChart(scenario) {
    const container = el('div', 'chart-container');
    const metrics = [
      { label: 'Scripting', ...scenario.metrics.scripting },
      { label: 'Rendering', ...scenario.metrics.rendering },
      { label: 'Painting', ...scenario.metrics.painting },
    ];

    const maxVal = Math.max(...metrics.flatMap(m => [m.current, m.baseline]), 1);
    const LABEL_W = 90;
    const BAR_AREA = 460;
    const BAR_H = 16;
    const BAR_GAP = 3;
    const GROUP_GAP = 16;
    const groupH = BAR_H * 2 + BAR_GAP;
    const totalH = metrics.length * (groupH + GROUP_GAP) + 36;
    const W = LABEL_W + BAR_AREA + 100;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', totalH);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + totalH);

    // Legend
    const legendY = 12;
    svg.appendChild(svgRect(LABEL_W, legendY - 9, 10, 10, '#6c8ebf', 1));
    svg.appendChild(svgText(LABEL_W + 14, legendY, 'Baseline (' + data.meta.baseBranch + ')', '#656d76', 11));
    svg.appendChild(svgRect(LABEL_W + 140, legendY - 9, 10, 10, '#d4a03c', 1));
    svg.appendChild(svgText(LABEL_W + 154, legendY, 'Current (PR)', '#656d76', 11));

    let y = 30;
    for (const m of metrics) {
      const bw = Math.max(1, (m.baseline / maxVal) * BAR_AREA);
      const cw = Math.max(1, (m.current / maxVal) * BAR_AREA);

      // Label
      svg.appendChild(svgText(LABEL_W - 8, y + BAR_H - 2, m.label, '#1f2328', 12, 'end'));

      // Baseline bar
      const bBar = svgRect(LABEL_W, y, bw, BAR_H, '#6c8ebf', 2);
      bBar.dataset.tooltip = m.label + ' baseline: ' + Math.round(m.baseline) + ' ms';
      svg.appendChild(bBar);
      svg.appendChild(svgText(LABEL_W + bw + 6, y + BAR_H - 4, Math.round(m.baseline) + ' ms', '#656d76', 11));

      // Current bar
      const cy = y + BAR_H + BAR_GAP;
      const cBar = svgRect(LABEL_W, cy, cw, BAR_H, '#d4a03c', 2);
      cBar.dataset.tooltip = m.label + ' current: ' + Math.round(m.current) + ' ms';
      svg.appendChild(cBar);
      svg.appendChild(svgText(LABEL_W + cw + 6, cy + BAR_H - 4, Math.round(m.current) + ' ms', '#656d76', 11));

      y += groupH + GROUP_GAP;
    }

    container.appendChild(svg);
    return container;
  }

  function buildHeapChart(scenario) {
    const heap = scenario.heap;
    const container = el('div', 'chart-container');
    const cur = heap.current;
    const hasBaseline = heap.baseline != null;
    const base = hasBaseline ? heap.baseline : 0;
    const maxVal = Math.max(cur, base, 1);
    const LABEL_W = 90;
    const BAR_AREA = 460;
    const BAR_H = 16;
    const BAR_GAP = 3;
    const totalH = (BAR_H * 2) + BAR_GAP + 36;
    const W = LABEL_W + BAR_AREA + 100;
    const mb = bytes => (bytes / 1e6).toFixed(1) + ' MB';

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', totalH);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + totalH);

    // Legend (JS heap is in MB on its own scale -- not comparable to the ms chart above).
    const legendY = 12;
    svg.appendChild(svgRect(LABEL_W, legendY - 9, 10, 10, '#6c8ebf', 1));
    svg.appendChild(svgText(LABEL_W + 14, legendY, 'Baseline (' + data.meta.baseBranch + ')', '#656d76', 11));
    svg.appendChild(svgRect(LABEL_W + 140, legendY - 9, 10, 10, '#d4a03c', 1));
    svg.appendChild(svgText(LABEL_W + 154, legendY, 'Current (PR)', '#656d76', 11));

    const y = 30;

    svg.appendChild(svgText(LABEL_W - 8, y + BAR_H - 2, 'JS Heap', '#1f2328', 12, 'end'));

    // Draw the baseline bar only when the golden snapshot has heap data; otherwise show "no baseline"
    // rather than a misleading 0 MB bar.
    if (hasBaseline) {
      const bw = Math.max(1, (base / maxVal) * BAR_AREA);
      const bBar = svgRect(LABEL_W, y, bw, BAR_H, '#6c8ebf', 2);

      bBar.dataset.tooltip = 'JS heap baseline: ' + mb(base);
      svg.appendChild(bBar);
      svg.appendChild(svgText(LABEL_W + bw + 6, y + BAR_H - 4, mb(base), '#656d76', 11));
    } else {
      svg.appendChild(svgText(LABEL_W, y + BAR_H - 4, 'no baseline', '#8c959f', 11));
    }

    const cy = y + BAR_H + BAR_GAP;
    const cw = Math.max(1, (cur / maxVal) * BAR_AREA);
    const cBar = svgRect(LABEL_W, cy, cw, BAR_H, '#d4a03c', 2);

    cBar.dataset.tooltip = 'JS heap current: ' + mb(cur);
    svg.appendChild(cBar);
    svg.appendChild(svgText(LABEL_W + cw + 6, cy + BAR_H - 4, mb(cur), '#656d76', 11));

    container.appendChild(svg);

    return container;
  }

  function buildHookTimingEl(hookTiming) {
    const div = el('div', 'hook-timing');
    let text = 'Hook timing: ' + Math.round(hookTiming.current) + ' ms';
    if (hookTiming.baseline != null) {
      text = 'Hook timing: ' + Math.round(hookTiming.baseline)
        + ' ms \\u2192 ' + Math.round(hookTiming.current) + ' ms';
      if (hookTiming.change != null) {
        text += ' (' + fmtPct(hookTiming.change) + ')';
      }
    }
    div.textContent = text;
    return div;
  }

  function buildMetricsTable(scenario) {
    const table = el('table', 'metrics-table');
    const thead = el('thead');
    const headRow = el('tr');

    const headers = data.hasBaseline
      ? ['Metric', 'Baseline', 'Current', 'Change', 'CV%']
      : ['Metric', 'Value', 'CV%'];

    for (const h of headers) {
      headRow.appendChild(elText('th', h));
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = el('tbody');
    for (const row of scenario.detailedMetrics) {
      const tr = el('tr');
      const labelTd = elText('td', row.label, row.isBold ? 'bold' : '');
      tr.appendChild(labelTd);

      if (data.hasBaseline) {
        tr.appendChild(elText('td', Math.round(row.baseline) + ' ms', 'num'));
        tr.appendChild(elText('td', Math.round(row.current) + ' ms', 'num'));
        const changeTd = elText('td', fmtPct(row.change), 'num');
        changeTd.style.color = statusColor(classifyChangeCss(row.change));
        tr.appendChild(changeTd);
      } else {
        tr.appendChild(elText('td', Math.round(row.current) + ' ms', 'num'));
      }

      const cvTd = elText('td', row.cv != null ? row.cv.toFixed(1) + '%' : '', 'num');
      if (row.cv != null && row.cv > 15) cvTd.classList.add('cv-warn');
      tr.appendChild(cvTd);

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  function buildMemoryTable(scenario) {
    const table = el('table', 'metrics-table');
    const thead = el('thead');
    const headRow = el('tr');
    const headers = data.hasBaseline
      ? ['Metric', 'Baseline', 'Current', 'Change']
      : ['Metric', 'Value'];
    for (const h of headers) {
      headRow.appendChild(elText('th', h));
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = el('tbody');
    for (const row of scenario.memory) {
      const tr = el('tr');
      tr.appendChild(elText('td', row.label));
      if (data.hasBaseline) {
        tr.appendChild(elText('td', row.baselineDisplay, 'num'));
        tr.appendChild(elText('td', row.currentDisplay, 'num'));
        const changeTd = elText('td', fmtPct(row.change), 'num');
        changeTd.style.color = statusColor(classifyChangeCss(row.change));
        tr.appendChild(changeTd);
      } else {
        tr.appendChild(elText('td', row.currentDisplay, 'num'));
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  function buildExpandSection(title, contentFn, autoOpen) {
    const section = el('div', 'expand-section');
    const header = el('div', 'expand-header');
    const arrow = elText('span', '\\u25B6', 'arrow' + (autoOpen ? ' open' : ''));
    header.appendChild(arrow);
    header.appendChild(document.createTextNode(' ' + title));

    const body = el('div', 'expand-body' + (autoOpen ? ' open' : ''));

    header.addEventListener('click', () => {
      // Lazy-render content on first expand
      if (!body.dataset.rendered) {
        body.appendChild(contentFn());
        body.dataset.rendered = '1';
      }
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });

    // If auto-open, render immediately
    if (autoOpen) {
      body.appendChild(contentFn());
      body.dataset.rendered = '1';
    }

    section.appendChild(header);
    section.appendChild(body);
    return section;
  }

  function buildTooltip() {
    const tip = el('div', 'tooltip');
    tip.id = 'tooltip';

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        tip.textContent = target.dataset.tooltip;
        tip.style.display = 'block';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (tip.style.display === 'block') {
        tip.style.left = (e.clientX + 12) + 'px';
        tip.style.top = (e.clientY - 8) + 'px';
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('[data-tooltip]')) {
        tip.style.display = 'none';
      }
    });

    return tip;
  }

  // --- Helpers ---

  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function elText(tag, text, cls) {
    const e = el(tag, cls);
    e.textContent = text;
    return e;
  }

  function svgRect(x, y, w, h, fill, rx) {
    const ns = 'http://www.w3.org/2000/svg';
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('fill', fill);
    if (rx) rect.setAttribute('rx', rx);
    return rect;
  }

  function svgText(x, y, text, fill, size, anchor) {
    const ns = 'http://www.w3.org/2000/svg';
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('fill', fill);
    t.setAttribute('font-size', size);
    t.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
    if (anchor) t.setAttribute('text-anchor', anchor);
    t.textContent = text;
    return t;
  }

  function fmtPct(pct) {
    if (pct == null) return '--';
    const sign = pct >= 0 ? '+' : '';
    return sign + pct.toFixed(1) + '%';
  }

  function classifyChangeCss(pct) {
    if (pct == null) return 'neutral';
    if (pct > 10) return 'regression';
    if (pct > 0) return 'neutral-up';
    if (pct < -10) return 'improvement';
    if (pct < 0) return 'neutral-down';
    return 'neutral';
  }

  function statusColor(cls) {
    const colors = {
      'regression': '#cf222e',
      'neutral-up': '#bf8700',
      'improvement': '#1a7f37',
      'neutral-down': '#0969da',
      'neutral': '#656d76',
    };
    return colors[cls] || '#656d76';
  }

  // --- Init ---
  document.body.appendChild(buildTooltip());
  render();
})();
<${'/' + 'script'}>`; // eslint-disable-line no-useless-concat
}
