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
// Usage:
//   node performance-tests/scripts/replay-goldens.mjs
//   node performance-tests/scripts/replay-goldens.mjs --since 2026-08-27 --window 5
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
  REGRESSION_CALLOUT_THRESHOLD_HEAP,
  REGRESSION_CALLOUT_THRESHOLD_TIMING,
  calcCv,
  sumActive,
} from '../lib/thresholds.mjs';

const GH_PAGES_REF = 'origin/gh-pages';
const DEVELOP_REPORTS = 'performance-reports/develop';

// The thresholds the curve is printed at. The two live constants are marked in the output so the
// current setting can be read against its neighbours.
const TIMING_THRESHOLDS = [5, 10, 15, 20, 25, 30];
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
 * Replays each golden as if it were a PR run, against a median of only the goldens before it.
 *
 * @param {Array<{ timestamp: string, snapshot: object }>} goldens -- oldest first
 * @param {number} windowSize
 * @returns {Array<{ scenario: string, timing: number | null, heap: number | null }>}
 */
function replay(goldens, windowSize) {
  const deltas = [];

  for (let i = windowSize; i < goldens.length; i += 1) {
    // Only the trailing window, never the run under test -- otherwise the baseline contains the
    // very run it is being compared against and the noise reads far smaller than it is.
    const window = goldens.slice(i - windowSize, i).map(entry => entry.snapshot);
    const baseline = computeMedianSnapshot(window, { windowSize });

    if (!baseline) {
      continue;
    }

    const current = goldens[i].snapshot.scenarios || {};

    for (const [scenario, currentEntry] of Object.entries(current)) {
      const baselineEntry = baseline.scenarios?.[scenario];

      if (!baselineEntry) {
        continue;
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

      deltas.push({
        scenario,
        timing: comparable(baseTotal, currentTotal)
          ? ((currentTotal - baseTotal) / baseTotal) * 100
          : null,
        heap: comparable(baseHeap, currentHeap)
          ? ((currentHeap - baseHeap) / baseHeap) * 100
          : null,
      });
    }
  }

  return deltas;
}

/**
 * @param {Array<object>} deltas
 * @param {'timing' | 'heap'} key
 * @param {number[]} thresholds
 * @param {number} live -- the threshold currently in force, marked in the output
 */
function printCurve(deltas, key, thresholds, live) {
  const values = deltas.map(d => d[key]).filter(v => v != null);

  if (values.length === 0) {
    console.log(`  no ${key} deltas to report`);

    return;
  }

  console.log(`  threshold   callouts fired on no-change comparisons   (n = ${values.length})`);

  for (const threshold of thresholds) {
    // One-sided, matching the callout rule: only a slowdown is called out.
    const fired = values.filter(v => v > threshold).length;
    const pct = ((fired / values.length) * 100).toFixed(0).padStart(3);
    const marker = threshold === live ? '  <-- in force' : '';

    console.log(`  ${String(threshold).padStart(8)}%   ${pct}%  (${fired})${marker}`);
  }

  const sorted = [...values].map(Math.abs).sort((a, b) => a - b);

  console.log(`  worst absolute delta: ${sorted[sorted.length - 1].toFixed(1)}%`);
}

/**
 * @param {Array<{ timestamp: string, snapshot: object }>} goldens
 */
function printPerScenarioSpread(goldens) {
  const scenarios = new Set(goldens.flatMap(g => Object.keys(g.snapshot.scenarios || {})));

  console.log('\n  run-to-run spread across every golden replayed:\n');
  console.log(`  ${'scenario'.padEnd(30)}${'timing CV'.padStart(11)}${'heap CV'.padStart(11)}`);

  for (const scenario of [...scenarios].sort()) {
    const entries = goldens
      .map(g => g.snapshot.scenarios?.[scenario])
      .filter(Boolean);
    const timing = calcCv(entries.map(e => sumActive(e.categories || {})));
    const heap = calcCv(entries.map(e => e.updateCounters?.jsHeapMaxBytes).filter(v => v != null));
    const fmt = v => (v == null ? 'n/a' : `${v.toFixed(1)}%`);

    console.log(`  ${scenario.padEnd(30)}${fmt(timing).padStart(11)}${fmt(heap).padStart(11)}`);
  }
}

/**
 * @param {string[]} argv
 * @returns {{ since: string | null, windowSize: number }}
 */
function parseArgs(argv) {
  const since = argv.includes('--since') ? argv[argv.indexOf('--since') + 1] : null;
  const windowRaw = argv.includes('--window') ? argv[argv.indexOf('--window') + 1] : null;
  const windowSize = windowRaw ? Number.parseInt(windowRaw, 10) : MEDIAN_WINDOW_SIZE;

  if (!Number.isFinite(windowSize) || windowSize < 2) {
    throw new Error(`--window must be an integer of at least 2, got "${windowRaw}"`);
  }

  return { since, windowSize };
}

async function main(argv) {
  const { since, windowSize } = parseArgs(argv);

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

  const deltas = replay(goldens, windowSize);

  console.log(`Replayed ${deltas.length} scenario comparison(s). Every one measures develop`);
  console.log('against develop, so every delta below is noise.\n');

  console.log('TIMING');
  printCurve(deltas, 'timing', TIMING_THRESHOLDS, REGRESSION_CALLOUT_THRESHOLD_TIMING);

  console.log('\nHEAP');
  printCurve(deltas, 'heap', HEAP_THRESHOLDS, REGRESSION_CALLOUT_THRESHOLD_HEAP);

  printPerScenarioSpread(goldens);

  console.log('');
}

// Only run when invoked directly, so the helpers stay importable from a test.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`\n${error.message}\n`);
    process.exitCode = 1;
  });
}

export { loadGoldens, replay, parseArgs };
