// Compact markdown report builder -- produces a summary table with regression
// callouts and a collapsible raw-details section. The heavy lifting (charts,
// interactive tables) lives in the HTML report instead.

import {
  REGRESSION_CALLOUT_THRESHOLD,
  pctChange,
  sumActive,
  fmtMs,
  fmtPct,
  fmtPctWithEmoji,
  formatTitle,
} from './thresholds.mjs';

/**
 * @param {Record<string, object>} allScenarioResults -- keyed by scenario name
 * @param {object | null} goldenSnapshots -- golden baseline (or null to self-compare)
 * @param {object} [meta] -- { runUrl }
 * @returns {string} full markdown report
 */
export function buildReport(allScenarioResults, goldenSnapshots, meta = {}) {
  const goldenScenarios = goldenSnapshots?.scenarios || {};
  const hasGolden = Object.keys(goldenScenarios).length > 0;
  const sections = [];

  // Summary table
  sections.push(buildSummaryTable(allScenarioResults, goldenScenarios, hasGolden));

  // Regression callouts (only for scenarios > threshold)
  if (hasGolden) {
    sections.push(buildRegressionCallouts(allScenarioResults, goldenScenarios));
  }

  // Link to full HTML report on GitHub Pages
  if (meta.pagesUrl) {
    sections.push(
      `\u{1F4CA} **[Full interactive report \u2192](${meta.pagesUrl})**`
    );
  }

  return sections.join('\n\n');
}

// --- summary table ---

// Memory-focused scenarios: their primary metric is JS heap, not trace timing. They are grouped at
// the bottom of the summary table so the timing scenarios read together at the top.
const MEMORY_SCENARIOS = new Set([
  'heap-initial-load',
  'heap-after-scroll',
  'source-data-validator-load',
]);

/**
 * Orders scenarios alphabetically, with the memory-focused ones grouped last.
 *
 * @param {Record<string, object>} results -- keyed by scenario name
 * @returns {Array<[string, object]>} ordered [name, data] entries
 */
function orderedScenarioEntries(results) {
  return Object.entries(results).sort(([a], [b]) => {
    const am = MEMORY_SCENARIOS.has(a) ? 1 : 0;
    const bm = MEMORY_SCENARIOS.has(b) ? 1 : 0;

    return am - bm || a.localeCompare(b);
  });
}

function buildSummaryTable(results, goldenScenarios, hasGolden) {
  const headers = hasGolden
    ? ['Scenario', 'Scripting', 'Rendering', 'Painting', 'Total', '\u0394 Total', 'JS Heap', '\u0394 Heap']
    : ['Scenario', 'Scripting', 'Rendering', 'Painting', 'Total', 'JS Heap'];

  const rows = [];

  for (const [name, current] of orderedScenarioEntries(results)) {
    const cats = current.categories || {};
    const total = sumActive(cats);
    const heap = current.updateCounters?.jsHeapMaxLabel ?? '--';

    if (hasGolden) {
      const golden = goldenScenarios[name];
      const goldenTotal = golden ? sumActive(golden.categories || {}) : null;
      const totalChange = fmtPctWithEmoji(pctChange(goldenTotal, total));
      const heapChange = fmtPctWithEmoji(
        pctChange(golden?.updateCounters?.jsHeapMaxBytes, current.updateCounters?.jsHeapMaxBytes)
      );

      rows.push([
        formatTitle(name), fmtMs(cats.scripting), fmtMs(cats.rendering),
        fmtMs(cats.painting), fmtMs(total), totalChange, heap, heapChange,
      ]);
    } else {
      rows.push([
        formatTitle(name), fmtMs(cats.scripting), fmtMs(cats.rendering),
        fmtMs(cats.painting), fmtMs(total), heap,
      ]);
    }
  }

  return `## \u26A1 Performance Results\n\n${formatMarkdownTable(headers, rows)}`;
}

// --- regression callouts ---

function buildRegressionCallouts(results, goldenScenarios) {
  const callouts = [];

  for (const [name, current] of Object.entries(results)) {
    const golden = goldenScenarios[name];

    if (!golden) {
      continue;
    }

    const currentTotal = sumActive(current.categories || {});
    const goldenTotal = sumActive(golden.categories || {});
    const totalPct = pctChange(goldenTotal, currentTotal);

    if (totalPct == null || totalPct <= REGRESSION_CALLOUT_THRESHOLD) {
      continue;
    }

    const title = formatTitle(name);
    const parts = [];

    for (const key of ['scripting', 'rendering', 'painting']) {
      const g = golden.categories?.[key];
      const c = current.categories?.[key];
      const p = pctChange(g, c);

      if (p != null) {
        const direction = p >= 0 ? 'slower' : 'faster';

        parts.push(`${categoryLabel(key)} ${fmtPct(p)} ${direction}`);
      }
    }

    callouts.push(`> \u26A0\uFE0F **${title}** regressed ${fmtPct(totalPct)}\n> ${parts.join(', ')}`);
  }

  if (callouts.length === 0) {
    return 'All scenarios within tolerance \u2705';
  }

  return `### Regressions\n\n${callouts.join('\n\n')}`;
}

// --- helpers ---

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
