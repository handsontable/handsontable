// Compact markdown report builder -- the sticky pull request comment and the job summary. It leads
// with the regression gate's verdict and lists only the scenarios that need a reader's attention,
// so its length grows with the problems, not with the number of scenarios. The full table is folded
// away below that, and the heavy lifting (charts, interactive tables) lives in the HTML report.

import {
  GATE_RUN_SHIFT_THRESHOLD,
  GATE_TIMING_FLOOR_MS,
  GATE_TIMING_THRESHOLD,
  HEAP_THRESHOLDS_BY_SCENARIO,
  REGRESSION_CALLOUT_THRESHOLD_HEAP,
  WATCH_TIMING_THRESHOLD,
  INCOMPARABLE_LABELS,
  activeTotalsPerIteration,
  calcCv,
  fmtCvValue,
  heapThresholdFor,
  isOverTimingLine,
  pctChange,
  relativeToShift,
  runShift,
  sumActive,
  comparability,
  sumActiveComparable,
  traceMismatches,
  fmtMs,
  fmtPct,
  fmtPctWithEmoji,
  formatTitle,
  fmtMsDelta,
} from './thresholds.mjs';
import { formatEnvironment } from './environment.mjs';
import { decideGate } from './gate.mjs';

/**
 * Decides every verdict the comment makes, once. `buildReport` renders from it and
 * `collectRegressions` lists from it, and the teardown passes the same object to both -- deciding it
 * per render site is how two parts of one comment once disagreed on one run.
 *
 * @param {Record<string, object>} allScenarioResults -- keyed by scenario name
 * @param {object | null} goldenSnapshots
 * @param {object} [meta] -- see buildReport
 * @returns {{ assessments: Array<object>, shift: number | null, hasGolden: boolean }}
 */
export function assessReport(allScenarioResults, goldenSnapshots, meta = {}) {
  const goldenScenarios = goldenSnapshots?.scenarios || {};
  const hasGolden = Object.keys(goldenScenarios).length > 0;
  const assessments = assessScenarios(allScenarioResults, goldenScenarios, traceMismatches(meta));
  // Not on a self-comparison: every delta is 0 there, and a shift of 0.0% would read as a
  // measurement of the runner.
  const shift = hasGolden && !goldenSnapshots?.isSelfCompare
    ? runShift(assessments.map(a => a.totalPct))
    : null;

  return { assessments, shift, hasGolden };
}

/**
 * @param {Record<string, object>} allScenarioResults -- keyed by scenario name
 * @param {object | null} goldenSnapshots -- golden baseline (or null to self-compare)
 * @param {object} [meta] -- { pagesUrl, crossWindowScenarios, versionMismatchScenarios, commit,
 *   runId, runUrl, environment, baselineUnavailable, gated }. `gated` is true on a pull request
 *   run, the only one the gate acts on (isGatedRun); it adds the gate's rules and what happens next
 *   to a failing headline.
 * @param {{ assessments: Array<object>, shift: number | null, hasGolden: boolean }} [assessment]
 *   -- from assessReport; computed here when the caller has no other use for it
 * @param {object} [verdict] -- from lib/gate.mjs decideGate, the one the job acts on. Decided here
 *   without a newest develop golden when the caller has none, which fails safe.
 * @returns {string} full markdown report
 */
export function buildReport(
  allScenarioResults, goldenSnapshots, meta = {},
  assessment = assessReport(allScenarioResults, goldenSnapshots, meta),
  verdict = decideGate({
    assessment, baseline: goldenSnapshots, unavailableReason: meta.baselineUnavailable ?? null,
  })
) {
  const goldenScenarios = goldenSnapshots?.scenarios || {};
  const { assessments, shift, hasGolden } = assessment;
  // A self-comparison is 0% by construction, so nothing on it may read as cleared or flagged.
  const compared = hasGolden && !goldenSnapshots?.isSelfCompare;
  const sections = [buildHeadline(verdict, assessments, meta, compared)];

  if (compared) {
    const attention = buildAttentionTable(verdict, assessments);

    if (attention) {
      sections.push(attention);
    }

    const notes = buildAssessmentNotes(assessments);

    if (notes) {
      sections.push(notes);
    }

    // The re-run and the approval it describes happen only where the gate acts.
    if (meta.gated) {
      sections.push(buildRulesLine());
    }
  }

  // Where the baseline came from, so a reader can tell one run from five
  const provenance = buildProvenanceFooter(goldenSnapshots, meta, hasGolden, shift, assessments);

  if (provenance) {
    sections.push(provenance);
  }

  // Link to full HTML report on GitHub Pages
  if (meta.pagesUrl) {
    sections.push(
      `\u{1F4CA} **[Full interactive report →](${meta.pagesUrl})**`
    );
  }

  // Everything, folded away: the full table and the hook timing.
  const details = [buildSummaryTable(assessments, hasGolden, shift)];
  const hookTiming = buildHookTimingSection(allScenarioResults, goldenScenarios, hasGolden);

  if (hookTiming) {
    details.push(hookTiming);
  }

  // The blank lines inside are what let GitHub render the tables within the fold.
  sections.push(
    `<details><summary>All ${assessments.length} scenarios</summary>\n\n${details.join('\n\n')}\n\n</details>`
  );

  return sections.join('\n\n');
}

/**
 * The scenarios a run regressed on, for a caller that needs the list rather than the prose -- the
 * golden (develop-push) teardown turns each into a `::warning` annotation on the develop run.
 *
 * Same assessment as the comment, so the two cannot disagree -- and the same run shift, so a
 * consumer can say how far a row sits from the rest of the run the way the footer does.
 *
 * @param {Record<string, object>} allScenarioResults
 * @param {object | null} goldenSnapshots
 * @param {object} [meta]
 * @param {{ assessments: Array<object>, shift: number | null }} [assessment] -- from assessReport,
 *   the same object the report was rendered from
 * @returns {Array<{ name: string, title: string, totalPct: number | null, heapPct: number | null,
 *   timingRegressed: boolean, heapRegressed: boolean, shift: number | null,
 *   relativePct: number | null }>}
 */
export function collectRegressions(
  allScenarioResults, goldenSnapshots, meta = {},
  assessment = assessReport(allScenarioResults, goldenSnapshots, meta)
) {
  if (!goldenSnapshots || goldenSnapshots.isSelfCompare) {
    return [];
  }

  const { assessments, shift } = assessment;

  return assessments
    .filter(a => a.timingRegressed || a.heapRegressed)
    .map(({ name, title, totalPct, heapPct, timingRegressed, heapRegressed }) => ({
      name,
      title,
      totalPct,
      heapPct,
      timingRegressed,
      heapRegressed,
      shift,
      relativePct: relativeToShift(totalPct, shift),
    }));
}

// --- assessment ---

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
 * @param {false | 'window-mismatch' | 'version-mismatch'} mismatch
 * @returns {{ change: number | null, baselineMs: number | null, currentMs: number | null,
 *   incomplete: boolean }} the two totals only when the comparison is publishable
 */
function totalDelta(current, golden, mismatch) {
  const withheld = { change: null, baselineMs: null, currentMs: null };

  if (!golden) {
    return { ...withheld, incomplete: false, label: null, shortLabel: null };
  }

  const verdict = comparability(golden.categories, current.categories, mismatch);

  if (!verdict.comparable) {
    return {
      ...withheld, incomplete: true, label: verdict.label, shortLabel: verdict.shortLabel,
    };
  }

  const { baseline, current: currentTotal } = sumActiveComparable(
    golden.categories, current.categories
  );

  return {
    change: pctChange(baseline, currentTotal),
    baselineMs: baseline,
    currentMs: currentTotal,
    incomplete: false,
    label: null,
    shortLabel: null,
  };
}

/**
 * Everything the table, the gate and the annotations need to know about one scenario, decided
 * once. Deciding it per render site is how one comment came to print a red heap cell in its table
 * and clear the same run elsewhere.
 *
 * @param {Record<string, object>} results
 * @param {Record<string, object>} goldenScenarios
 * @param {Record<string, 'window-mismatch' | 'version-mismatch'>} mismatches -- per scenario name
 * @returns {Array<object>}
 */
function assessScenarios(results, goldenScenarios, mismatches) {
  return orderedScenarioEntries(results).map(([name, current]) => {
    const golden = goldenScenarios[name];
    // A trace-level mismatch: the two sides bracket different slices (window) or different
    // definitions of the scenario (version). Both withhold everything derived from the trace.
    const traceMismatch = mismatches[name] ?? false;
    const {
      change: totalPct, baselineMs, currentMs, incomplete, label, shortLabel,
    } = totalDelta(current, golden, traceMismatch);
    // Heap survives a missed timing category -- the two are measured independently -- but not a
    // trace mismatch: jsHeapMaxBytes is a maximum over the samples inside the window, so two
    // windows (or two definitions) sample two different things.
    const heapPct = !golden || traceMismatch
      ? null
      : pctChange(golden.updateCounters?.jsHeapMaxBytes, current.updateCounters?.jsHeapMaxBytes);
    const heapThreshold = heapThresholdFor(name);

    return {
      name,
      title: formatTitle(name),
      current,
      golden,
      traceMismatch,
      totalPct,
      baselineMs,
      currentMs,
      incomplete,
      label,
      shortLabel,
      heapPct,
      heapThreshold,
      // The gate's fail line, floor included, so the develop annotations and the gate agree.
      timingRegressed: isOverTimingLine(baselineMs, currentMs),
      heapRegressed: heapPct != null && heapPct > heapThreshold,
    };
  });
}

// --- summary table ---

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

  // Only the baseline's spread is flagged. A run's own spread is wide by construction on a few
  // scenarios (undo-edit's iterations read ~100% apart on every run while its develop runs sit 1.5%
  // apart), so a flag there fired on every comment and meant nothing.
  return `${fmtCvValue(calcCv(iterationTotals), { flag: false })} / ${fmtCvValue(golden?.spread)}`;
}

function buildSummaryTable(assessments, hasGolden, shift) {
  // The column only when a shift was estimated, on the same condition as its legend: on a
  // self-comparison or a thin table every cell would read "--" with nothing explaining what it is.
  const hasShift = hasGolden && shift != null;
  const headers = hasGolden
    ? [
      'Scenario', 'Scripting', 'Rendering', 'Painting', 'Total', 'Δ Total',
      ...(hasShift ? ['Δ vs shift'] : []),
      'CV run / base', 'JS Heap', 'Δ Heap',
    ]
    : ['Scenario', 'Scripting', 'Rendering', 'Painting', 'Total', 'CV run', 'JS Heap'];

  const rows = [];

  for (const a of assessments) {
    const { current, golden } = a;
    const cats = current.categories || {};
    const total = sumActive(cats);
    const heap = current.updateCounters?.jsHeapMaxLabel ?? '--';

    if (hasGolden) {
      // The verdict's own wording. A fixed "baseline incomplete" misattributes a failure of this
      // run's own capture to develop, and sends a maintainer to re-run develop for nothing.
      let totalChange = a.incomplete ? a.shortLabel : fmtPctWithEmoji(a.totalPct);

      // Over the line in percent but under the ms floor is what the gate watches, not what it fails,
      // so the cell says the same (a 13 ms scenario at +12% is 1.6 ms of timer rounding).
      if (!a.incomplete && a.totalPct > GATE_TIMING_THRESHOLD && !a.timingRegressed) {
        totalChange = `${fmtPct(a.totalPct)} \u{1F7E1}`;
      }
      // Informational, no emoji: the gate runs on the raw delta and a second set of colours here would
      // let the two columns reach opposite verdicts on one row.
      const vsShift = hasShift ? [fmtPct(relativeToShift(a.totalPct, shift))] : [];
      // Withheld here as the gate withholds it, so the table and the verdict cannot reach opposite
      // verdicts on the same run.
      const heapChange = a.traceMismatch
        // The mismatch's own label, not the baseline-side one: the heap cell is only ever withheld
        // for a trace mismatch, where the baseline captured everything and it is the windows or
        // the definitions that differ. "baseline incomplete" here would give one row two
        // explanations for one cause.
        ? INCOMPARABLE_LABELS[a.traceMismatch]
        : fmtPctWithEmoji(a.heapPct, a.heapThreshold, null);

      rows.push([
        a.title, fmtMs(cats.scripting), fmtMs(cats.rendering),
        fmtMs(cats.painting), fmtMs(total), totalChange, ...vsShift,
        reliabilityCell(current, golden), heap, heapChange,
      ]);
    } else {
      rows.push([
        a.title, fmtMs(cats.scripting), fmtMs(cats.rendering),
        fmtMs(cats.painting), fmtMs(total),
        // The run's own spread, unflagged for the same reason as in reliabilityCell.
        fmtCvValue(calcCv(activeTotalsPerIteration(current._iterationValues?.categories)), { flag: false }), heap,
      ]);
    }
  }

  // The shift sentence on the same condition as the column.
  const shiftLegend = hasShift
    ? '`Δ vs shift`: the delta with this run\'s common shift against the baseline removed (see the '
      + 'footer); the gate uses the raw `Δ Total`. '
    : '';
  const legend = hasGolden
    ? `\n\n<sub>${shiftLegend}`
      + '`CV run / base`: spread across the iterations of this run, then across the develop runs '
      + 'behind the baseline. A high second number means the baseline itself moves, so read the '
      + 'delta beside it loosely.</sub>'
    : '';

  return `${formatMarkdownTable(headers, rows)}${legend}`;
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
      // The run's own spread, unflagged for the same reason as in reliabilityCell.
      fmtCvValue(calcCv(current._iterationValues?.hookTiming), { flag: false }),
    ];

    if (hasGolden) {
      // No marker: the gate never judges hook timing, and markers appear only where it acts.
      row.push(fmtPct(pctChange(golden?.hookTiming, current.hookTiming)));
    }

    rows.push(row);
  }

  if (rows.length === 0) {
    return '';
  }

  const headers = hasGolden
    ? ['Scenario', 'Hook', 'CV run', 'Δ Hook']
    : ['Scenario', 'Hook', 'CV run'];

  return `### Hook timing\n\n${formatMarkdownTable(headers, rows)}`;
}

// --- the gate's verdict ---

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

/**
 * @param {number} count
 * @param {string} noun -- singular
 * @returns {string} "1 scenario", "2 scenarios"
 */
function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * What happens next on a failing pull request run, or '' anywhere the gate does not act.
 *
 * @param {object} verdict
 * @param {object} meta
 * @returns {string}
 */
function nextStep(verdict, meta) {
  if (!meta.gated) {
    return '';
  }

  const run = meta.runUrl ? `[workflow run](${meta.runUrl})` : 'workflow run';

  if (verdict.mode === 'block') {
    return '\n\nWaiting for approval: if the slowdown is intended, a reviewer approves the pending '
      + `\`performance-approval\` deployment on the ${run}; otherwise push a fix. A new push measures `
      + 'and asks again.';
  }

  return '\n\nThe gate is in warn mode, so nothing waits. In block mode this run would need an approval '
    + 'on the `performance-approval` environment.';
}

/**
 * The comment's first line: the gate's verdict in a number a reviewer reads at a glance.
 *
 * @param {object} verdict -- from decideGate
 * @param {Array<object>} assessments
 * @param {object} meta
 * @param {boolean} compared -- false without a develop baseline, or on a self-comparison
 * @returns {string}
 */
function buildHeadline(verdict, assessments, meta, compared) {
  const title = '## ⚡ Performance';

  // Nothing to compare against: raw numbers only, and the footer says why. Never "within
  // tolerance", which would be a claim about nothing.
  if (!compared) {
    return `${title}: not compared against develop`;
  }

  if (verdict.status === 'not-assessed') {
    return `${title}: ⏸ not assessed\n\nNot assessed: ${verdict.reason}.`;
  }

  const total = assessments.length;
  const cleared = verdict.rerun?.cleared ?? [];
  const clearedNames = new Set(cleared.map(scenario => scenario.name));
  // A scenario the re-run cleared can also be watched on its second run; the table lists it once, as
  // cleared, and so does the headline.
  const watching = verdict.watching.filter(scenario => !clearedNames.has(scenario.name));
  const extras = [
    watching.length > 0 ? `${watching.length} to watch` : '',
    verdict.absorbed.length > 0 ? `${verdict.absorbed.length} already on develop` : '',
    cleared.length > 0 ? `${cleared.length} cleared on re-run` : '',
  ].filter(Boolean).map(text => ` · ${text}`).join('');

  if (verdict.status === 'fail') {
    const regressed = verdict.failing.length;
    const what = regressed > 0
      ? `❌ ${regressed} of ${plural(total, 'scenario')} regressed`
      : `❌ every scenario ran slower (${fmtPct(verdict.shift)})`;
    // The run-wide reason as well when scenarios also failed on their own.
    const shift = regressed > 0 && verdict.shiftFailed ? `\n\n${verdict.reason}.` : '';

    return `${title}: ${what}${extras}${shift}${nextStep(verdict, meta)}`;
  }

  // Over the line on a level develop already shows is not within tolerance: it is counted out here
  // and named in the extras, like a scenario that could not be judged.
  const outside = new Set([
    ...assessments.filter(a => !a.golden || a.incomplete).map(a => a.name),
    ...verdict.absorbed.map(scenario => scenario.name),
  ]);
  const within = outside.size > 0
    ? `${total - outside.size} of ${plural(total, 'scenario')} within tolerance`
    : `all ${plural(total, 'scenario')} within tolerance`;

  return `${title}: ✅ ${within}${extras}`;
}

/**
 * The scenarios a reader has to look at, and nothing else: failing, already on develop, cleared
 * on the re-run, and to watch. Its length grows with the problems, not with the suite.
 *
 * @param {object} verdict -- from decideGate
 * @param {Array<object>} assessments
 * @returns {string} a markdown table, or '' when nothing needs attention
 */
function buildAttentionTable(verdict, assessments) {
  const byName = new Map(assessments.map(a => [a.name, a]));
  const confirmed = new Set(verdict.rerun?.confirmed ?? []);
  const unconfirmed = new Set(verdict.rerun?.unconfirmed ?? []);
  const listed = new Set();
  const rows = [];
  const add = (scenario, status, moved) => {
    // A scenario the re-run cleared can also be watched on its second run; it is listed once.
    if (listed.has(scenario.name)) {
      return;
    }

    listed.add(scenario.name);
    rows.push([
      scenario.title, status, fmtPct(scenario.timingPct), fmtMsDelta(scenario.deltaMs),
      fmtPct(scenario.heapPct), moved,
    ]);
  };
  const whatMoved = (scenario) => {
    const a = byName.get(scenario.name);
    const parts = [];

    // The timing breakdown only when timing is why the scenario is listed: on a heap-only failure
    // it is three flat categories that say nothing.
    if (a?.golden && !a.incomplete && (scenario.overTiming || !scenario.overHeap)) {
      parts.push(buildTimingBreakdown(a.current, a.golden));
    }

    if (scenario.overHeap) {
      parts.push(`JS heap ${fmtPct(scenario.heapPct)} larger`);
    }

    return parts.filter(Boolean).join('; ') || '--';
  };

  for (const scenario of verdict.failing) {
    let status = '❌ regressed';

    if (confirmed.has(scenario.name)) {
      status = '❌ regressed, confirmed on re-run';
    } else if (unconfirmed.has(scenario.name)) {
      status = '❌ regressed, re-run could not measure it';
    }

    add(scenario, status, whatMoved(scenario));
  }

  for (const scenario of verdict.absorbed) {
    add(scenario, '➖ already on develop', whatMoved(scenario));
  }

  for (const scenario of verdict.rerun?.cleared ?? []) {
    add(scenario, '✔️ cleared on re-run', 'first run only');
  }

  for (const scenario of verdict.watching) {
    add(scenario, '🟡 to watch', whatMoved(scenario));
  }

  if (rows.length === 0) {
    return '';
  }

  return formatMarkdownTable(['Scenario', 'Status', 'Δ Total', 'Δ ms', 'Δ Heap', 'What moved'], rows);
}

/**
 * The scenarios the comparison could not judge, said so rather than folded into "within
 * tolerance": neither cleared nor flagged.
 *
 * @param {Array<object>} assessments
 * @returns {string} a `<sub>` line, or ''
 */
function buildAssessmentNotes(assessments) {
  const skipped = [];
  const noBaseline = [];

  for (const a of assessments) {
    if (!a.golden) {
      // Not in the baseline at all -- new, or omitted by the median window -- which is not the
      // same as a comparison that failed. Reported by name rather than silently dropped, so a
      // scenario missing from every count above has somewhere honest to land.
      noBaseline.push(a.title);
      continue;
    }

    if (a.incomplete) {
      // A trace mismatch withholds heap too (jsHeapMaxBytes is a maximum over the samples inside
      // the parsed window, invalid across two different windows or definitions), so a reader must
      // not conclude heap was still assessed just because it isn't named separately. A baseline
      // that only missed a timing category keeps its heap: the two are measured independently.
      const heapNote = a.traceMismatch ? '; heap also not assessed' : '';

      skipped.push(`${a.title} (${a.label}${heapNote})`);
    }
  }

  const notes = [];

  if (skipped.length > 0) {
    notes.push(`Total delta not assessed: ${skipped.join(', ')}.`);
  }

  // Kept distinct from `skipped`, which is baselines that exist but disagree.
  if (noBaseline.length > 0) {
    notes.push(`No baseline yet: ${noBaseline.join(', ')}.`);
  }

  return notes.length > 0 ? `<sub>${notes.join(' ')}</sub>` : '';
}

/**
 * @returns {string} the gate's rules in one line, stated from the constants it runs on
 */
function buildRulesLine() {
  const heapOverrides = Object.entries(HEAP_THRESHOLDS_BY_SCENARIO)
    .map(([name, threshold]) => `+${threshold}% on ${name}`)
    .join(', ');

  return `<sub>Gate: a scenario fails above +${GATE_TIMING_THRESHOLD}% and +${GATE_TIMING_FLOOR_MS} ms of `
    + `active time, or +${REGRESSION_CALLOUT_THRESHOLD_HEAP}% of JS heap (${heapOverrides}), and is `
    + `watched above +${WATCH_TIMING_THRESHOLD}%. Every scenario slower by more than `
    + `+${GATE_RUN_SHIFT_THRESHOLD}% fails the run. A failing scenario is re-run once and passes only `
    + 'when the re-run measures it under the line.</sub>';
}

// --- provenance ---

/**
 * States what the deltas above were measured against, on what, and how far the whole run sits from
 * it. Without this the comment reads identically whether the baseline was a five-run median or one
 * fluke develop push, and whether the runner was a fast one or a slow one.
 *
 * @param {object | null} goldenSnapshots
 * @param {object} meta
 * @param {boolean} hasGolden
 * @param {number | null} shift
 * @param {Array<object>} assessments
 * @returns {string}
 */
function buildProvenanceFooter(goldenSnapshots, meta, hasGolden, shift, assessments) {
  if (!hasGolden) {
    // A golden (develop-push) run with nothing compatible to compare against -- the first pushes
    // after a Chromium or harness change. Compare mode falls back to a self-comparison and says why
    // there; here there is no self-comparison, so say why here or the job summary reads as if the
    // tooling silently stopped comparing.
    if (!meta.baselineUnavailable) {
      return '';
    }

    const current = formatCurrent(meta);

    return `<sub>No comparable develop baseline: ${meta.baselineUnavailable}.${current}</sub>`;
  }

  let baseline;

  if (goldenSnapshots?.isSelfCompare) {
    // The reason the run had nothing to compare against is the one thing a reader of a self-comparison
    // needs, and "no develop baseline was available" alone sends them to check gh-pages.
    const why = meta.baselineUnavailable ? `: ${meta.baselineUnavailable}` : ', no develop baseline was available';

    baseline = `this run compared against itself${why} (every delta above is 0% by construction)`;
  } else if (goldenSnapshots?.isMedian) {
    const sources = goldenSnapshots.medianSourceTimestamps || [];
    const range = sources.length > 1
      ? ` (${sources[sources.length - 1]} to ${sources[0]})`
      : '';

    baseline = `median of ${goldenSnapshots.medianWindowSize} develop runs${range}`;
  } else if (goldenSnapshots?.timestamp) {
    baseline = `single develop run ${goldenSnapshots.timestamp}`;
  } else {
    baseline = 'unknown';
  }

  // The browser the baseline was recorded in. Same as the current one whenever the compatibility
  // key selected it; printed anyway, because a local run without history can compare across it.
  if (!goldenSnapshots?.isSelfCompare && goldenSnapshots?.environment?.chromium) {
    baseline += `, Chromium ${goldenSnapshots.environment.chromium}`;
  }

  const current = formatCurrent(meta);

  let shiftNote = '';

  if (shift != null) {
    const rows = assessments.filter(a => a.totalPct != null).length;

    shiftNote = ` Run shift: ${fmtPct(shift)} (median Δ across ${rows} scenarios: how much `
      + 'faster or slower this runner ran than the baseline\'s, which every scenario shares; '
      + '`Δ vs shift` removes it, and the gate judges the raw `Δ Total`).';
  }

  return `<sub>Baseline: ${baseline}.${current}${shiftNote}</sub>`;
}

/**
 * " Current: commit `abc1234`, run `42`, Chromium ... · CPU ×N · image." -- or '' when nothing is known.
 *
 * @param {object} meta
 * @returns {string}
 */
function formatCurrent(meta) {
  const parts = [];

  if (meta.commit) {
    parts.push(`commit \`${String(meta.commit).slice(0, 7)}\``);
  }

  if (meta.runId) {
    parts.push(`run \`${meta.runId}\``);
  }

  const environment = formatEnvironment(meta.environment);

  if (environment) {
    parts.push(environment);
  }

  return parts.length > 0 ? ` Current: ${parts.join(', ')}.` : '';
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
