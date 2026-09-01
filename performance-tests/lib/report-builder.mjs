// Compact markdown report builder -- produces a summary table with regression
// callouts and a collapsible raw-details section. The heavy lifting (charts,
// interactive tables) lives in the HTML report instead.

import {
  REGRESSION_CALLOUT_THRESHOLD_TIMING,
  REGRESSION_CALLOUT_THRESHOLD_HEAP,
  BASELINE_INCOMPLETE_LABEL,
  calcCv,
  fmtCvValue,
  pctChange,
  sumActive,
  sumActiveComparable,
  fmtMs,
  fmtPct,
  fmtPctWithEmoji,
  formatTitle,
} from './thresholds.mjs';

/**
 * @param {Record<string, object>} allScenarioResults -- keyed by scenario name
 * @param {object | null} goldenSnapshots -- golden baseline (or null to self-compare)
 * @param {object} [meta] -- { pagesUrl, crossWindowScenarios, baseline }
 * @returns {string} full markdown report
 */
export function buildReport(allScenarioResults, goldenSnapshots, meta = {}) {
  const goldenScenarios = goldenSnapshots?.scenarios || {};
  const hasGolden = Object.keys(goldenScenarios).length > 0;
  const crossWindow = new Set(meta.crossWindowScenarios || []);
  const sections = [];

  // Summary table
  sections.push(buildSummaryTable(allScenarioResults, goldenScenarios, hasGolden, crossWindow));

  // Hook timing, for the scenarios that measure it independently of the trace
  const hookTiming = buildHookTimingSection(allScenarioResults, goldenScenarios, hasGolden);

  if (hookTiming) {
    sections.push(hookTiming);
  }

  // Regression callouts (only for scenarios > threshold)
  if (hasGolden) {
    sections.push(buildRegressionCallouts(allScenarioResults, goldenScenarios, crossWindow));
  }

  // Where the baseline came from, so a reader can tell one run from five
  const provenance = buildProvenanceFooter(goldenSnapshots, meta, hasGolden);

  if (provenance) {
    sections.push(provenance);
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
  'initial-load',
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

/**
 * Decides whether a scenario's total delta may be published, and computes it if so.
 *
 * Two things disqualify a comparison. The baseline may have failed to capture a category the
 * current run did record, in which case the two sums describe different things (the filed defect:
 * ~4 ms of real work divided against a baseline that never measured it, published as +115.7%). Or
 * the two sides may have been measured through different trace windows, which PR1's `windowSource`
 * discriminator detects.
 *
 * @param {object} current
 * @param {object | undefined} golden
 * @param {boolean} isCrossWindow
 * @returns {{ change: number | null, incomplete: boolean }}
 */
function totalDelta(current, golden, isCrossWindow) {
  if (!golden) {
    return { change: null, incomplete: false };
  }

  if (isCrossWindow) {
    return { change: null, incomplete: true };
  }

  const { baseline, current: currentTotal, comparable } = sumActiveComparable(
    golden.categories, current.categories
  );

  if (!comparable) {
    return { change: null, incomplete: true };
  }

  return { change: pctChange(baseline, currentTotal), incomplete: false };
}

/**
 * Renders the two spreads a reader needs to weigh a delta, side by side.
 *
 * They measure different things and are not interchangeable. The first is how much the three
 * back-to-back iterations of this run disagreed; the second is how far apart the develop runs
 * behind the baseline median sit. After PR1 the first is routinely under 4% while the second is
 * 11-19%, so showing only the first would advertise a confidence the comparison does not have.
 *
 * @param {object} current
 * @param {object | undefined} golden
 * @returns {string}
 */
function reliabilityCell(current, golden) {
  const iterationTotals = activeTotalsPerIteration(current._iterationValues?.categories);

  return `${fmtCvValue(calcCv(iterationTotals))} / ${fmtCvValue(golden?.spread)}`;
}

/**
 * Recombines per-category iteration arrays into one active-time total per iteration.
 *
 * @param {Record<string, number[]> | undefined} categories
 * @returns {number[]}
 */
function activeTotalsPerIteration(categories) {
  if (!categories) {
    return [];
  }

  const length = Math.max(
    ...['scripting', 'rendering', 'painting'].map(key => categories[key]?.length ?? 0)
  );

  return Array.from({ length }, (_, i) => sumActive({
    scripting: categories.scripting?.[i],
    rendering: categories.rendering?.[i],
    painting: categories.painting?.[i],
  }));
}

function buildSummaryTable(results, goldenScenarios, hasGolden, crossWindow) {
  const headers = hasGolden
    ? [
      'Scenario', 'Scripting', 'Rendering', 'Painting', 'Total', '\u0394 Total',
      'CV run / base', 'JS Heap', '\u0394 Heap',
    ]
    : ['Scenario', 'Scripting', 'Rendering', 'Painting', 'Total', 'CV run', 'JS Heap'];

  const rows = [];

  for (const [name, current] of orderedScenarioEntries(results)) {
    const cats = current.categories || {};
    const total = sumActive(cats);
    const heap = current.updateCounters?.jsHeapMaxLabel ?? '--';

    if (hasGolden) {
      const golden = goldenScenarios[name];
      const { change, incomplete } = totalDelta(current, golden, crossWindow.has(name));
      const totalChange = incomplete ? BASELINE_INCOMPLETE_LABEL : fmtPctWithEmoji(change);
      const heapChange = fmtPctWithEmoji(
        pctChange(golden?.updateCounters?.jsHeapMaxBytes, current.updateCounters?.jsHeapMaxBytes),
        REGRESSION_CALLOUT_THRESHOLD_HEAP
      );

      rows.push([
        formatTitle(name), fmtMs(cats.scripting), fmtMs(cats.rendering),
        fmtMs(cats.painting), fmtMs(total), totalChange,
        reliabilityCell(current, golden), heap, heapChange,
      ]);
    } else {
      rows.push([
        formatTitle(name), fmtMs(cats.scripting), fmtMs(cats.rendering),
        fmtMs(cats.painting), fmtMs(total),
        fmtCvValue(calcCv(activeTotalsPerIteration(current._iterationValues?.categories))), heap,
      ]);
    }
  }

  const legend = hasGolden
    ? '\n\n<sub>`CV run / base`: spread across the three iterations of this run, then across the '
      + 'develop runs behind the baseline. A high second number means the baseline itself moves, '
      + 'so read the delta beside it loosely.</sub>'
    : '';

  return `## \u26A1 Performance Results\n\n${formatMarkdownTable(headers, rows)}${legend}`;
}

// --- hook timing ---

/**
 * Hook timing is measured in-page around the hook pair rather than derived from the trace, so it is
 * an independent check on the trace window. Only the scenarios that install a timer report it.
 *
 * @param {Record<string, object>} results
 * @param {Record<string, object>} goldenScenarios
 * @param {boolean} hasGolden
 * @returns {string} markdown section, or '' when no scenario measures a hook
 */
function buildHookTimingSection(results, goldenScenarios, hasGolden) {
  const rows = [];

  for (const [name, current] of orderedScenarioEntries(results)) {
    if (current.hookTiming == null) {
      continue;
    }

    const golden = goldenScenarios[name];
    const row = [
      formatTitle(name),
      fmtMs(current.hookTiming),
      fmtCvValue(calcCv(current._iterationValues?.hookTiming)),
    ];

    if (hasGolden) {
      row.push(fmtPctWithEmoji(pctChange(golden?.hookTiming, current.hookTiming)));
    }

    rows.push(row);
  }

  if (rows.length === 0) {
    return '';
  }

  const headers = hasGolden
    ? ['Scenario', 'Hook', 'CV run', '\u0394 Hook']
    : ['Scenario', 'Hook', 'CV run'];

  return `### Hook timing\n\n${formatMarkdownTable(headers, rows)}`;
}

// --- regression callouts ---

function buildTimingBreakdown(current, golden) {
  const parts = [];

  for (const key of ['scripting', 'rendering', 'painting']) {
    const p = pctChange(golden.categories?.[key], current.categories?.[key]);

    if (p != null) {
      parts.push(`${categoryLabel(key)} ${fmtPct(p)} ${p >= 0 ? 'slower' : 'faster'}`);
    }
  }

  return parts.join(', ');
}

function buildRegressionCallouts(results, goldenScenarios, crossWindow) {
  const callouts = [];
  const skipped = [];

  for (const [name, current] of orderedScenarioEntries(results)) {
    const golden = goldenScenarios[name];

    if (!golden) {
      continue;
    }

    const { change: totalPct, incomplete } = totalDelta(current, golden, crossWindow.has(name));

    if (incomplete) {
      skipped.push(formatTitle(name));
    }

    const heapPct = pctChange(
      golden.updateCounters?.jsHeapMaxBytes, current.updateCounters?.jsHeapMaxBytes
    );
    const timingRegressed = totalPct != null && totalPct > REGRESSION_CALLOUT_THRESHOLD_TIMING;
    const heapRegressed = heapPct != null && heapPct > REGRESSION_CALLOUT_THRESHOLD_HEAP;

    if (!timingRegressed && !heapRegressed) {
      continue;
    }

    const title = formatTitle(name);
    const header = timingRegressed
      ? `> \u26A0\uFE0F **${title}** regressed ${fmtPct(totalPct)}`
      : `> \u26A0\uFE0F **${title}** regressed`;
    const lines = [header];

    if (timingRegressed) {
      lines.push(`> ${buildTimingBreakdown(current, golden)}`);
    }

    if (heapRegressed) {
      lines.push(`> JS heap ${fmtPct(heapPct)} larger`);
    }

    callouts.push(lines.join('\n'));
  }

  // A scenario whose baseline is unusable was neither cleared nor flagged, so say so rather than
  // letting it fall silently into "within tolerance".
  const note = skipped.length > 0
    ? `\n\n<sub>Not assessed (${BASELINE_INCOMPLETE_LABEL}): ${skipped.join(', ')}.</sub>`
    : '';

  if (callouts.length === 0) {
    return `All assessed scenarios within tolerance \u2705${note}`;
  }

  return `### Regressions\n\n${callouts.join('\n\n')}${note}`;
}

// --- provenance ---

/**
 * States what the deltas above were measured against. Without this the comment reads identically
 * whether the baseline was a five-run median or one fluke develop push.
 *
 * @param {object | null} goldenSnapshots
 * @param {object} meta
 * @param {boolean} hasGolden
 * @returns {string}
 */
function buildProvenanceFooter(goldenSnapshots, meta, hasGolden) {
  if (!hasGolden) {
    return '';
  }

  let baseline;

  if (goldenSnapshots?.isMedian) {
    const sources = goldenSnapshots.medianSourceTimestamps || [];
    const range = sources.length > 1
      ? ` (${sources[sources.length - 1]} to ${sources[0]})`
      : '';

    baseline = `median of ${goldenSnapshots.medianWindowSize} develop runs${range}`;
  } else if (goldenSnapshots?.timestamp) {
    baseline = `single develop run ${goldenSnapshots.timestamp}`;
  } else {
    baseline = 'self-comparison, no develop baseline';
  }

  const currentParts = [];

  if (meta.commit) {
    currentParts.push(`commit \`${String(meta.commit).slice(0, 7)}\``);
  }

  if (meta.runId) {
    currentParts.push(`run \`${meta.runId}\``);
  }

  const current = currentParts.length > 0 ? ` Current: ${currentParts.join(', ')}.` : '';

  return `<sub>Baseline: ${baseline}.${current}</sub>`;
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
