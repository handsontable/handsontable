#!/usr/bin/env node
//
// Replays the develop goldens published on gh-pages through the same median-baseline selection CI
// uses, and reports how often a no-change comparison would have fired a regression callout.
//
// Every develop golden measures develop, so any delta this produces is noise by construction. That
// makes the output a direct read of the false-positive rate at a given callout threshold, which is
// the only defensible way to pick one. Re-run it after any change to how the suite measures or to
// which baseline it compares against, and move REGRESSION_CALLOUT_THRESHOLD_TIMING to the knee of
// the curve it prints.
//
// It also replays the regression gate itself (lib/thresholds.mjs, GATE_*), rule for rule, and
// counts runs as well as comparisons: the gate fails a whole job when any one scenario crosses its
// line, so the rate that matters for it is the share of runs with at least one fail.
//
// Usage:
//   node performance-tests/scripts/replay-goldens.mjs
//   node performance-tests/scripts/replay-goldens.mjs --since 2026-08-27 --window 5
//   node performance-tests/scripts/replay-goldens.mjs --since 2026-09-18 --floor-ms 2
//
// Reads the snapshots straight out of the gh-pages branch, so `git fetch origin gh-pages` first.

import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  MEDIAN_WINDOW_SIZE,
  computeMedianSnapshot,
} from '../lib/median-snapshot.mjs';
import {
  GATE_RUN_SHIFT_THRESHOLD,
  GATE_TIMING_FLOOR_MS,
  GATE_TIMING_THRESHOLD,
  REGRESSION_CALLOUT_THRESHOLD_HEAP,
  REGRESSION_CALLOUT_THRESHOLD_TIMING,
  WATCH_TIMING_THRESHOLD,
  calcCv,
  comparability,
  heapThresholdFor,
  isOverTimingLine,
  runShift,
  sumActive,
} from '../lib/thresholds.mjs';
import {
  DEFAULT_MEASUREMENT_VERSION,
  baselineKey,
  describeKey,
  isCompatibleBaseline,
  isCompleteKey,
} from '../lib/environment.mjs';

const GH_PAGES_REF = 'origin/gh-pages';
const DEVELOP_REPORTS = 'performance-reports/develop';

// The thresholds the curve is printed at. The live constants are marked in the output so the
// current setting can be read against its neighbours.
const TIMING_THRESHOLDS = [3, 5, 7.5, 10, 15, 20, 30];
const HEAP_THRESHOLDS = [2, 3, 5, 10, 15];

/**
 * @returns {string} the repository root, so git commands are not CWD-relative
 */
function repoRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/**
 * @param {string[]} args
 * @returns {string} stdout
 */
function git(args) {
  return execFileSync('git', args, { cwd: repoRoot(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/**
 * @param {object} options
 * @param {string | null} options.since -- ignore snapshot directories named before this prefix
 * @returns {Array<{ timestamp: string, snapshot: object }>} oldest first
 */
function loadGoldens({ since }) {
  let listing;

  try {
    listing = git(['ls-tree', '--name-only', GH_PAGES_REF, `${DEVELOP_REPORTS}/`]);
  } catch {
    throw new Error(
      `Cannot read ${GH_PAGES_REF}. Run \`git fetch origin gh-pages\` and try again.`
    );
  }

  const dirs = listing
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(path => path.replace(/\/$/, ''))
    .map(path => path.slice(`${DEVELOP_REPORTS}/`.length))
    // latest.json and index.html live alongside the timestamped directories.
    .filter(name => /^\d{4}-\d{2}-\d{2}T/.test(name))
    .filter(name => !since || name >= since)
    .sort();

  const goldens = [];

  for (const name of dirs) {
    let raw;

    try {
      raw = git(['show', `${GH_PAGES_REF}:${DEVELOP_REPORTS}/${name}/snapshots.json`]);
    } catch {
      continue;
    }

    try {
      goldens.push({ timestamp: name, snapshot: JSON.parse(raw) });
    } catch {
      console.warn(`  skipping ${name}: unparseable snapshots.json`);
    }
  }

  return goldens;
}

/**
 * The goldens a run may be compared against, as CI would select them: the same compatibility key
 * (Chromium build, platform, and harness version) when the run carries one, and only other unkeyed goldens when it
 * does not -- so a replay across a Playwright bump, or across the commit that introduced
 * provenance, never medians the two environments together.
 *
 * @param {Array<{ timestamp: string, snapshot: object }>} earlier -- goldens before the run, oldest first
 * @param {object} current -- the run's snapshot
 * @returns {{ candidates: Array<object>, compatibleWith: object | null }}
 */
function compatibleWindow(earlier, current) {
  const key = baselineKey(current);

  if (!isCompleteKey(key)) {
    return {
      candidates: earlier.filter(entry => !isCompleteKey(baselineKey(entry.snapshot))),
      compatibleWith: null,
    };
  }

  const scenarioVersions = Object.fromEntries(
    Object.entries(current.scenarios || {}).map(([name, entry]) => [
      name, entry?.measurementVersion ?? DEFAULT_MEASUREMENT_VERSION,
    ])
  );

  return {
    candidates: earlier.filter(entry => isCompatibleBaseline(entry.snapshot, key)),
    compatibleWith: { key, scenarioVersions },
  };
}

/**
 * One scenario's deltas against the baseline, or null when the reports would refuse to publish the
 * comparison.
 *
 * @param {object} baselineEntry
 * @param {object | undefined} currentEntry
 * @returns {{ timing: number | null, timingMs: number | null, baseMs: number | null,
 *   heap: number | null } | null}
 */
function compareEntry(baselineEntry, currentEntry) {
  if (!baselineEntry || !currentEntry) {
    return null;
  }

  // Model what the reports actually publish, not every arithmetic difference. The median
  // baseline is always marks-valid (isValidForMedian enforces it), but the run standing in for
  // a PR is not filtered, so its window source has to be checked here the way teardown checks
  // it. A comparison the shipped code refuses to publish must not count toward the
  // false-positive rate used to pick the thresholds.
  const currentWindow = currentEntry.windowSource ?? 'auto-zoom';
  const verdict = comparability(
    baselineEntry.categories, currentEntry.categories, currentWindow !== 'marks'
  );

  if (!verdict.comparable) {
    return null;
  }

  const baseTotal = sumActive(baselineEntry.categories || {});
  const currentTotal = sumActive(currentEntry.categories || {});
  const baseHeap = baselineEntry.updateCounters?.jsHeapMaxBytes;
  const currentHeap = currentEntry.updateCounters?.jsHeapMaxBytes;

  // Both sides must be finite numbers. A golden entry carrying updateCounters but no
  // jsHeapMaxBytes would otherwise yield NaN, which survives a null filter, inflates the
  // sample count, understates every fired count and prints a NaN worst-case.
  const comparable = (base, value) => Number.isFinite(base) && base > 0
    && Number.isFinite(value);
  const timingComparable = comparable(baseTotal, currentTotal);

  return {
    timing: timingComparable ? ((currentTotal - baseTotal) / baseTotal) * 100 : null,
    timingMs: timingComparable ? currentTotal - baseTotal : null,
    baseMs: timingComparable ? baseTotal : null,
    heap: comparable(baseHeap, currentHeap)
      ? ((currentHeap - baseHeap) / baseHeap) * 100
      : null,
  };
}

/**
 * Replays each golden as if it were a PR run, against a median of only the goldens before it.
 *
 * Every delta also carries how the newest golden in the window compares against the same median
 * (`newest`), because the gate does not blame a run for a level develop already shows.
 *
 * @param {Array<{ timestamp: string, snapshot: object }>} goldens -- oldest first
 * @param {number} windowSize
 * @returns {{ deltas: Array<{ run: string, scenario: string, timing: number | null,
 *   timingMs: number | null, baseMs: number | null, heap: number | null,
 *   newest: object | null }>, skippedIncomparable: number, skippedThinWindow: number }}
 */
function replay(goldens, windowSize) {
  const deltas = [];
  let skippedIncomparable = 0;
  let skippedThinWindow = 0;

  for (let i = 1; i < goldens.length; i += 1) {
    // Only the trailing window, never the run under test -- otherwise the baseline contains the
    // very run it is being compared against and the noise reads far smaller than it is.
    const { candidates, compatibleWith } = compatibleWindow(goldens.slice(0, i), goldens[i].snapshot);

    // A full window, as CI would have had. The first runs after a key change have fewer compatible
    // predecessors and CI would have reported "no baseline" for them, so they are not replayed.
    if (candidates.length < windowSize) {
      skippedThinWindow += 1;
      continue;
    }

    const window = candidates.slice(-windowSize).map(entry => entry.snapshot);
    const baseline = computeMedianSnapshot(window, { windowSize, compatibleWith });

    if (!baseline) {
      continue;
    }

    const current = goldens[i].snapshot.scenarios || {};
    // The newest golden the median was drawn from -- what a PR's develop HEAD looked like.
    const newestScenarios = window[window.length - 1].scenarios || {};

    for (const [scenario, currentEntry] of Object.entries(current)) {
      const baselineEntry = baseline.scenarios?.[scenario];

      if (!baselineEntry) {
        continue;
      }

      const delta = compareEntry(baselineEntry, currentEntry);

      if (!delta) {
        skippedIncomparable += 1;
        continue;
      }

      deltas.push({
        run: goldens[i].timestamp,
        scenario,
        ...delta,
        newest: compareEntry(baselineEntry, newestScenarios[scenario]),
      });
    }
  }

  return { deltas, skippedIncomparable, skippedThinWindow };
}

/**
 * Nearest-rank percentile.
 *
 * @param {number[]} values
 * @param {number} p -- 0 to 100
 * @returns {number | null}
 */
function percentile(values, p) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil((p / 100) * sorted.length)));

  return sorted[rank - 1];
}

/**
 * How often a one-sided threshold fires on the replayed deltas, per comparison and per run.
 *
 * @param {Array<object>} deltas -- from replay()
 * @param {'timing' | 'heap'} key
 * @param {number[]} thresholds -- percent
 * @param {{ floorMs?: number }} [options] -- timing only: the slowdown must also exceed this many ms
 * @returns {Array<{ threshold: number, comparisons: number, fired: number, runs: number,
 *   runsFired: number }>}
 */
function thresholdCurve(deltas, key, thresholds, { floorMs = 0 } = {}) {
  const values = deltas.filter(d => d[key] != null);
  const runs = new Set(values.map(d => d.run)).size;

  return thresholds.map((threshold) => {
    // One-sided, matching the callout and the gate: only a slowdown counts.
    const fired = values.filter(d => (key === 'timing'
      ? isOverTimingLine(d.baseMs, d.baseMs + d.timingMs, threshold, floorMs)
      : d[key] > threshold));

    return {
      threshold,
      comparisons: values.length,
      fired: fired.length,
      runs,
      runsFired: new Set(fired.map(d => d.run)).size,
    };
  });
}

/**
 * Whether one comparison crosses the gate's fail line, on timing or on heap.
 *
 * @param {{ scenario: string, timing: number | null, timingMs: number | null,
 *   baseMs: number | null, heap: number | null } | null} delta
 * @param {object} rules
 * @returns {{ timing: boolean, heap: boolean }}
 */
function overGateLine(delta, rules) {
  if (!delta) {
    return { timing: false, heap: false };
  }

  return {
    timing: delta.timing != null
      && isOverTimingLine(delta.baseMs, delta.baseMs + delta.timingMs, rules.timingThreshold, rules.floorMs),
    heap: delta.heap != null && delta.heap > rules.heapThreshold(delta.scenario),
  };
}

/**
 * Replays the regression gate run by run, rule for rule:
 *
 * - a scenario fails when its timing or heap delta crosses the fail line;
 * - unless the newest golden in the window crosses the same line against the same median, in which
 *   case the level came from develop and the scenario is only listed (`absorbed`);
 * - a run also fails as a whole when its shift is above the run-shift line, unless the newest
 *   golden's shift is too;
 * - a scenario above the watch line that does not fail is listed as `watching`.
 *
 * The confirm re-run cannot be replayed: a golden has one pass. So this is an upper bound on the
 * false-fail rate of the shipped gate.
 *
 * @param {Array<object>} deltas -- from replay()
 * @param {object} [options]
 * @returns {Array<{ run: string, fails: boolean, failing: Array<object>, absorbed: Array<object>,
 *   watching: Array<object>, shift: number | null, newestShift: number | null,
 *   shiftFailed: boolean }>} one entry per replayed run, oldest first
 */
function replayGate(deltas, options = {}) {
  const rules = {
    timingThreshold: GATE_TIMING_THRESHOLD,
    floorMs: GATE_TIMING_FLOOR_MS,
    watchThreshold: WATCH_TIMING_THRESHOLD,
    shiftThreshold: GATE_RUN_SHIFT_THRESHOLD,
    heapThreshold: heapThresholdFor,
    ...options,
  };
  const byRun = new Map();

  for (const delta of deltas) {
    if (!byRun.has(delta.run)) {
      byRun.set(delta.run, []);
    }

    byRun.get(delta.run).push(delta);
  }

  return [...byRun].map(([run, rows]) => {
    const failing = [];
    const absorbed = [];
    const watching = [];

    for (const delta of rows) {
      const own = overGateLine(delta, rules);
      const newest = overGateLine(delta.newest && { ...delta.newest, scenario: delta.scenario }, rules);
      const fails = (own.timing && !newest.timing) || (own.heap && !newest.heap);

      if (fails) {
        failing.push(delta);
      } else if (own.timing || own.heap) {
        absorbed.push(delta);
      } else if (delta.timing != null && delta.timing > rules.watchThreshold) {
        watching.push(delta);
      }
    }

    const shift = runShift(rows.map(d => d.timing));
    const newestShift = runShift(rows.map(d => d.newest?.timing));
    const shiftFailed = shift != null && shift > rules.shiftThreshold
      && !(newestShift != null && newestShift > rules.shiftThreshold);

    return {
      run,
      fails: failing.length > 0 || shiftFailed,
      failing,
      absorbed,
      watching,
      shift,
      newestShift,
      shiftFailed,
    };
  });
}

/**
 * Per-scenario noise from the replayed deltas: the calibration numbers. Unlike a CV over every
 * golden, these are deltas against a trailing median, so a real level change on develop shows up
 * once (on the first golden at the new level) instead of inflating the spread of the whole range.
 *
 * @param {Array<object>} deltas -- from replay()
 * @returns {Array<{ scenario: string, n: number, baseMs: number | null, p95: number | null,
 *   max: number | null }>}
 */
function scenarioNoise(deltas) {
  const scenarios = [...new Set(deltas.map(d => d.scenario))].sort();

  return scenarios.map((scenario) => {
    const rows = deltas.filter(d => d.scenario === scenario && d.timing != null);
    const magnitudes = rows.map(d => Math.abs(d.timing));

    return {
      scenario,
      n: rows.length,
      baseMs: percentile(rows.map(d => d.baseMs), 50),
      p95: percentile(magnitudes, 95),
      max: magnitudes.length > 0 ? Math.max(...magnitudes) : null,
    };
  });
}

/**
 * How many goldens sit in each compatibility group. A replay that spans a platform or Chromium change shows two
 * rows here, and the thin-window count above tells how many runs after the boundary went unreplayed.
 *
 * @param {Array<{ timestamp: string, snapshot: object }>} goldens
 */
function printKeyGroups(goldens) {
  const groups = new Map();

  for (const { snapshot } of goldens) {
    const key = baselineKey(snapshot);
    const label = isCompleteKey(key) ? describeKey(key) : 'no provenance recorded';

    groups.set(label, (groups.get(label) || 0) + 1);
  }

  console.log('Compatibility groups (only goldens in the same group are medianed together):');

  for (const [label, count] of groups) {
    console.log(`  ${String(count).padStart(4)}  ${label}`);
  }

  console.log('');
}

/**
 * Heap callouts per scenario, at the shared constant and at the scenario's own threshold, so a
 * per-scenario override in HEAP_THRESHOLDS_BY_SCENARIO can be read against the noise it answers.
 *
 * @param {Array<object>} deltas
 */
function printHeapByScenario(deltas) {
  const scenarios = [...new Set(deltas.map(d => d.scenario))].sort();

  console.log('\n  heap callouts per scenario on no-change comparisons:\n');
  console.log(
    `  ${'scenario'.padEnd(30)}${'n'.padStart(5)}${`>${REGRESSION_CALLOUT_THRESHOLD_HEAP}%`.padStart(9)}`
    + `${'threshold'.padStart(12)}${'fired'.padStart(8)}`
  );

  for (const scenario of scenarios) {
    const values = deltas.filter(d => d.scenario === scenario && d.heap != null).map(d => d.heap);

    if (values.length === 0) {
      continue;
    }

    const threshold = heapThresholdFor(scenario);
    const atShared = values.filter(v => v > REGRESSION_CALLOUT_THRESHOLD_HEAP).length;
    const atOwn = values.filter(v => v > threshold).length;

    console.log(
      `  ${scenario.padEnd(30)}${String(values.length).padStart(5)}${String(atShared).padStart(9)}`
      + `${`${threshold}%`.padStart(12)}${String(atOwn).padStart(8)}`
    );
  }
}

/**
 * @param {number} part
 * @param {number} whole
 * @returns {string} e.g. "2.75%"
 */
function share(part, whole) {
  return whole > 0 ? `${((part / whole) * 100).toFixed(2)}%` : 'n/a';
}

/**
 * @param {Array<object>} deltas
 * @param {'timing' | 'heap'} key
 * @param {number[]} thresholds
 * @param {Record<number, string>} live -- the thresholds currently in force, marked in the output
 * @param {{ floorMs?: number }} [options] -- timing only; prints a second pair of columns with it
 */
function printCurve(deltas, key, thresholds, live, { floorMs = 0 } = {}) {
  const values = deltas.map(d => d[key]).filter(v => v != null);

  if (values.length === 0) {
    console.log(`  no ${key} deltas to report`);

    return;
  }

  const plain = thresholdCurve(deltas, key, thresholds);
  const floored = floorMs > 0 ? thresholdCurve(deltas, key, thresholds, { floorMs }) : null;
  const { comparisons, runs } = plain[0];

  console.log(`  fired on no-change comparisons (n = ${comparisons}) and runs with any (n = ${runs})`);
  console.log(
    `  ${'threshold'.padStart(9)}${'comparisons'.padStart(16)}${'runs'.padStart(16)}`
    + `${floored ? `${`+ >${floorMs} ms: runs`.padStart(24)}` : ''}`
  );

  plain.forEach((row, index) => {
    const marker = live[row.threshold] ? `  <-- ${live[row.threshold]}` : '';
    const withFloor = floored
      ? `${`${floored[index].runsFired} (${share(floored[index].runsFired, runs)})`.padStart(24)}`
      : '';

    console.log(
      `  ${`${row.threshold}%`.padStart(9)}`
      + `${`${row.fired} (${share(row.fired, comparisons)})`.padStart(16)}`
      + `${`${row.runsFired} (${share(row.runsFired, runs)})`.padStart(16)}`
      + `${withFloor}${marker}`
    );
  });

  const worst = deltas
    .filter(d => d[key] != null && d[key] > 0)
    .sort((a, b) => b[key] - a[key])
    .slice(0, 5)
    .map(d => `${d.scenario} +${d[key].toFixed(1)}% (${d.run})`);

  console.log(`  largest slowdowns: ${worst.length > 0 ? worst.join(', ') : 'none'}`);
}

/**
 * @param {Array<object>} gateRuns -- from replayGate()
 */
function printGate(gateRuns) {
  const failed = gateRuns.filter(r => r.fails);
  const absorbed = gateRuns.filter(r => r.absorbed.length > 0);
  const watched = gateRuns.filter(r => r.watching.length > 0);
  const shifts = gateRuns.map(r => r.shift).filter(v => v != null);
  const fmt = v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

  console.log(
    `  rules: fail above +${GATE_TIMING_THRESHOLD}% and +${GATE_TIMING_FLOOR_MS} ms timing, above the heap `
    + `callout line, or a run shift above +${GATE_RUN_SHIFT_THRESHOLD}%; watch above +${WATCH_TIMING_THRESHOLD}%; `
    + 'a level the newest golden already shows is not a fail'
  );
  const count = runs => `${runs.length} of ${gateRuns.length} (${share(runs.length, gateRuns.length)})`;

  console.log(`  runs that would fail:              ${count(failed)}`);
  console.log(`  runs with a level develop showed:  ${count(absorbed)}`);
  console.log(`  runs with a scenario to watch:     ${count(watched)}`);

  if (shifts.length > 0) {
    console.log(
      `  run shift: p50 ${fmt(percentile(shifts, 50))}, min ${fmt(Math.min(...shifts))}, `
      + `max ${fmt(Math.max(...shifts))}`
    );
  }

  const fmtMs = v => `${v >= 0 ? '+' : ''}${v.toFixed(1)} ms`;
  const describe = d => `${d.scenario} ${fmt(d.timing ?? 0)}`
    + `${d.timingMs != null ? ` (${fmtMs(d.timingMs)})` : ''}`
    + `${d.heap != null ? `, heap ${fmt(d.heap)}` : ''}`;

  for (const run of failed) {
    const reasons = run.failing.map(describe);

    if (run.shiftFailed) {
      reasons.push(`run shift ${fmt(run.shift)}`);
    }

    console.log(`    FAIL ${run.run}: ${reasons.join('; ')}`);
  }

  for (const run of absorbed) {
    console.log(`    develop level ${run.run}: ${run.absorbed.map(describe).join('; ')}`);
  }
}

/**
 * @param {Array<object>} deltas
 * @param {Array<{ timestamp: string, snapshot: object }>} goldens
 */
function printScenarioNoise(deltas, goldens) {
  const fmt = v => (v == null ? 'n/a' : `${v.toFixed(1)}%`);
  const fmtMs = v => (v == null ? 'n/a' : `${v.toFixed(1)} ms`);

  console.log('\n  per-scenario noise (|delta| against the trailing median; use these to calibrate):\n');
  console.log(
    `  ${'scenario'.padEnd(30)}${'n'.padStart(5)}${'base'.padStart(12)}${'|Δ| p95'.padStart(10)}`
    + `${'|Δ| max'.padStart(10)}${'fail line'.padStart(12)}${'CV all*'.padStart(10)}${'heap CV'.padStart(10)}`
  );

  for (const row of scenarioNoise(deltas)) {
    const entries = goldens.map(g => g.snapshot.scenarios?.[row.scenario]).filter(Boolean);
    const timingCv = calcCv(entries.map(e => sumActive(e.categories || {})));
    const heapCv = calcCv(entries.map(e => e.updateCounters?.jsHeapMaxBytes).filter(v => v != null));
    // What the gate's line means in ms for this scenario: the larger of its two parts.
    const line = row.baseMs == null
      ? null
      : Math.max((row.baseMs * GATE_TIMING_THRESHOLD) / 100, GATE_TIMING_FLOOR_MS);

    console.log(
      `  ${row.scenario.padEnd(30)}${String(row.n).padStart(5)}${fmtMs(row.baseMs).padStart(12)}`
      + `${fmt(row.p95).padStart(10)}${fmt(row.max).padStart(10)}${fmtMs(line).padStart(12)}`
      + `${fmt(timingCv).padStart(10)}${fmt(heapCv).padStart(10)}`
    );
  }

  console.log(
    '\n  * CV over every golden in range. It includes real level changes on develop (a merged speed-up'
    + '\n    or slowdown), so it overstates the noise; the |Δ| columns do not.'
  );
}

/**
 * @param {string[]} argv
 * @returns {{ since: string | null, windowSize: number, floorMs: number }}
 */
function parseArgs(argv) {
  const since = argv.includes('--since') ? argv[argv.indexOf('--since') + 1] : null;
  const windowRaw = argv.includes('--window') ? argv[argv.indexOf('--window') + 1] : null;
  const windowSize = windowRaw ? Number.parseInt(windowRaw, 10) : MEDIAN_WINDOW_SIZE;
  const floorRaw = argv.includes('--floor-ms') ? argv[argv.indexOf('--floor-ms') + 1] : null;
  const floorMs = floorRaw == null ? GATE_TIMING_FLOOR_MS : Number(floorRaw);

  if (!Number.isFinite(windowSize) || windowSize < 2) {
    throw new Error(`--window must be an integer of at least 2, got "${windowRaw}"`);
  }

  if (!Number.isFinite(floorMs) || floorMs < 0) {
    throw new Error(`--floor-ms must be a number of at least 0, got "${floorRaw}"`);
  }

  return { since, windowSize, floorMs };
}

async function main(argv) {
  const { since, windowSize, floorMs } = parseArgs(argv);

  console.log(`\nReplaying develop goldens from ${GH_PAGES_REF} (window ${windowSize})`);

  if (since) {
    console.log(`Restricted to snapshots at or after ${since}`);
  }

  const goldens = loadGoldens({ since });

  console.log(`Loaded ${goldens.length} golden snapshot(s)\n`);

  if (goldens.length <= windowSize) {
    throw new Error(
      `Need more than ${windowSize} goldens to replay even one comparison, have ${goldens.length}.`
    );
  }

  printKeyGroups(goldens);

  const { deltas, skippedIncomparable, skippedThinWindow } = replay(goldens, windowSize);

  if (skippedIncomparable > 0) {
    console.log(
      `Skipped ${skippedIncomparable} comparison(s) the reports would refuse to publish `
      + '(incomplete capture or window mismatch).\n'
    );
  }

  if (skippedThinWindow > 0) {
    console.log(
      `Skipped ${skippedThinWindow} run(s) with fewer than ${windowSize} compatible predecessors, `
      + 'where CI would have reported no baseline.\n'
    );
  }

  console.log(`Replayed ${deltas.length} scenario comparison(s). Every one measures develop`);
  console.log('against develop, so every delta below is noise.\n');

  console.log('TIMING');
  printCurve(deltas, 'timing', TIMING_THRESHOLDS, {
    [REGRESSION_CALLOUT_THRESHOLD_TIMING]: 'callout',
    [GATE_TIMING_THRESHOLD]: 'gate',
    [WATCH_TIMING_THRESHOLD]: 'watch',
  }, { floorMs });

  console.log('\nHEAP');
  printCurve(deltas, 'heap', HEAP_THRESHOLDS, { [REGRESSION_CALLOUT_THRESHOLD_HEAP]: 'callout and gate' });

  console.log('\nGATE (replayed rule for rule; the confirm re-run is not, so this is an upper bound)');
  printGate(replayGate(deltas));

  printScenarioNoise(deltas, goldens);
  printHeapByScenario(deltas);

  console.log('');
}

// Only run when invoked directly, so the helpers stay importable from a test.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`\n${error.message}\n`);
    process.exitCode = 1;
  });
}

export {
  loadGoldens,
  replay,
  parseArgs,
  compatibleWindow,
  percentile,
  thresholdCurve,
  replayGate,
  scenarioNoise,
};
