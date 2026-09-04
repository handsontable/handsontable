// Playwright globalTeardown -- parse all trace files, average per scenario,
// build the markdown report, and optionally save/compare golden snapshots.

import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseTrace, averageParsedTraces, formatHeapMaxBytesLabel } from '../trace-parser.mjs';
import { exists } from './fs-utils.mjs';
import { HEAP_AFTER_GC_FILE } from './heap-after-gc.mjs';
import { saveSnapshots, loadBaseline } from './snapshot-store.mjs';
import { buildReport, collectRegressions } from './report-builder.mjs';
import { buildHtmlReport } from './html-report-builder.mjs';
import { HARNESS_VERSION } from './trace-runner.mjs';
import {
  DEFAULT_MEASUREMENT_VERSION,
  currentKey,
  describeKey,
  isCompleteKey,
  readEnvironment,
} from './environment.mjs';
import { fmtPct } from './thresholds.mjs';

const OUTPUT_DIR = join(import.meta.dirname, '..', 'output');
const SCENARIOS_DIR = join(import.meta.dirname, '..', 'scenarios');

/**
 * The `measurementVersion` a scenario's own config declares. Output directories are named after the
 * scenario (the config's `name` must match the directory, see the performance-testing skill), so
 * the config is found by that name.
 *
 * @param {string} name
 * @returns {Promise<number>}
 */
async function measurementVersionOf(name) {
  const configPath = join(SCENARIOS_DIR, name, 'scenario.config.mjs');

  if (!await exists(configPath)) {
    return DEFAULT_MEASUREMENT_VERSION;
  }

  try {
    const { default: config } = await import(pathToFileURL(configPath).href);
    const version = config?.measurementVersion;

    return typeof version === 'number' && Number.isFinite(version) ? version : DEFAULT_MEASUREMENT_VERSION;
  } catch (err) {
    console.warn(`  WARN: could not read ${name}/scenario.config.mjs (${err.message}); ` +
      `assuming measurementVersion ${DEFAULT_MEASUREMENT_VERSION}`);

    return DEFAULT_MEASUREMENT_VERSION;
  }
}

async function collectScenarioResults() {
  if (!await exists(OUTPUT_DIR)) {
    return {};
  }

  const results = {};
  const entries = await readdir(OUTPUT_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const scenarioDir = join(OUTPUT_DIR, entry.name);
    const allFiles = await readdir(scenarioDir);
    const traceFiles = allFiles
      .filter(f => f.startsWith('iteration-') && f.endsWith('.json'))
      .sort()
      .map(f => join(scenarioDir, f));

    if (traceFiles.length === 0) {
      continue;
    }

    process.stdout.write(`  Parsing ${entry.name} (${traceFiles.length} iterations)...`);

    // Parse each iteration
    const parsedResults = [];

    for (const fp of traceFiles) {
      const text = await readFile(fp, 'utf8');

      parsedResults.push(parseTrace(JSON.parse(text)));
      process.stdout.write('.');
    }

    // From the filename, not the position: the list is lexicographically sorted, so at ten
    // or more iterations the order runs 1, 10, 11, 2 and a position would mislabel them.
    const iterationNumbers = traceFiles.map((fp) => {
      const matched = /iteration-(\d+)\.json$/.exec(fp);

      return matched ? matched[1] : '?';
    });

    console.log(' done');

    // Every number this suite publishes assumes the window came from the marks the
    // runner writes around the action. Without them the parser silently falls back to
    // the DevTools auto-zoom, which lands on the CDP interrupt rather than the grid
    // work -- the exact defect the marks exist to avoid. windowSource lives in _debug,
    // which is stripped before the snapshot is saved, so say it out loud here or it is
    // invisible everywhere.
    const fellBack = parsedResults
      .map((result, index) => (result._debug?.windowSource === 'marks' ? null : iterationNumbers[index]))
      .filter(iteration => iteration !== null);

    if (fellBack.length > 0) {
      const detail = `${entry.name} iteration(s) ${fellBack.join(', ')} carried no measurement marks, ` +
        'so they fell back to the auto-zoomed window and are not comparable to marked runs.';

      // A compare run is read once and thrown away, so a warning is proportionate. A golden
      // run is not: averageParsedTraces folds the bad iteration into the mean, the develop
      // push deploys that mean as the baseline for every later PR, and _debug is stripped on
      // the way out -- so nothing downstream can ever tell. Re-running develop is cheap;
      // a poisoned baseline is silent forever.
      if (process.env.PERF_MODE === 'golden') {
        throw new Error(`${detail} Refusing to record a golden baseline from it.`);
      }

      console.warn(`  WARN: ${detail}`);
    }

    // Collect per-iteration values for CV% calculation
    const iterationValues = collectIterationValues(parsedResults);

    // Average across iterations
    const averaged = averageParsedTraces(parsedResults);

    averaged._iterationValues = iterationValues;

    // Survives stripInternalFields, unlike _debug. A snapshot recorded before the marks
    // existed carries no windowSource at all, which is exactly how a comparison against a
    // pre-marks baseline is recognised -- see the mismatch check below.
    averaged.windowSource = fellBack.length > 0 ? 'auto-zoom' : 'marks';

    // Which definition of the scenario these numbers measure. Bumped in scenario.config.mjs when a
    // spec moves work in or out of the window; the median baseline only draws on entries at the
    // same version (median-snapshot.mjs).
    averaged.measurementVersion = await measurementVersionOf(entry.name);

    // Load hook timing if saved alongside traces
    const hookTimingPath = join(scenarioDir, 'hook-timing.json');

    if (await exists(hookTimingPath)) {
      const hookData = JSON.parse(await readFile(hookTimingPath, 'utf8'));

      averaged.hookTiming = hookData.averageDeltaMs ?? null;
      averaged._iterationValues.hookTiming = hookData.deltas ?? [];
    }

    // The live heap the runner read after each end mark (lib/heap-after-gc.mjs). Folded into
    // updateCounters beside the windowed extrema it is meant to eventually replace as the gate.
    const heapAfterGcPath = join(scenarioDir, HEAP_AFTER_GC_FILE);

    if (await exists(heapAfterGcPath)) {
      const heapData = JSON.parse(await readFile(heapAfterGcPath, 'utf8'));
      const bytes = typeof heapData.averageBytes === 'number' ? heapData.averageBytes : null;

      // The per-iteration readings stay in heap-after-gc.json (uploaded with the artifact); no
      // report reads them yet, so they are not carried on _iterationValues.
      if (bytes !== null) {
        averaged.updateCounters = {
          ...(averaged.updateCounters || {}),
          jsHeapAfterGcBytes: bytes,
          jsHeapAfterGcLabel: formatHeapMaxBytesLabel(bytes),
        };
      }
    }

    results[entry.name] = averaged;
  }

  return results;
}

function collectIterationValues(parsedResults) {
  const values = {
    categories: {},
    rangeEnd: [],
  };

  const catKeys = new Set();

  for (const r of parsedResults) {
    if (r.categories) {
      for (const k of Object.keys(r.categories)) {
        catKeys.add(k);
      }
    }
  }

  for (const key of catKeys) {
    // Index-aligned to the iteration, never compacted. Dropping the entries where a category
    // recorded nothing would both understate that category's own spread and, once the arrays are
    // recombined into an active total, pair one iteration's scripting with another's painting.
    // An iteration that recorded no time in a category recorded zero of it.
    values.categories[key] = parsedResults.map((r) => {
      const value = r.categories?.[key];

      return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    });
  }

  values.rangeEnd = parsedResults.map(r => r.rangeEnd);

  return values;
}

function stripInternalFields(results) {
  return Object.fromEntries(
    Object.entries(results).map(([name, data]) => {
      const { _iterationValues, _debug, ...rest } = data;

      return [name, rest];
    })
  );
}

/**
 * Prints one GitHub Actions warning annotation per regressed scenario, so a shift on develop is
 * visible on the develop run that introduced it rather than on the next five pull requests.
 *
 * @param {Array<object>} regressions -- from collectRegressions
 * @param {object} golden
 */
function annotateRegressions(regressions, golden) {
  if (!process.env.GITHUB_ACTIONS || regressions.length === 0) {
    return;
  }

  const against = golden.isMedian
    ? `median of ${golden.medianWindowSize} earlier develop runs`
    : `develop run ${golden.timestamp}`;

  for (const r of regressions) {
    const parts = [];

    if (r.timingRegressed) {
      parts.push(`total ${fmtPct(r.totalPct)}`);

      // Same context the markdown callout gives: a slow runner fires on every row at once, and the
      // annotation must not read identically to a row that moved on its own.
      if (r.relativePct != null) {
        parts.push(`${fmtPct(r.relativePct)} relative to this run's shift of ${fmtPct(r.shift)}`);
      }
    }

    if (r.heapRegressed) {
      parts.push(`JS heap ${fmtPct(r.heapPct)}`);
    }

    console.log(
      `::warning title=Performance regression on develop::${r.title} ${parts.join(', ')} against the ${against}`
    );
  }
}

/** Playwright globalTeardown entry point */
export default async function teardown() {
  console.log('\n=== Performance teardown: processing traces ===\n');

  const scenarioResults = await collectScenarioResults();
  const scenarioCount = Object.keys(scenarioResults).length;

  if (scenarioCount === 0) {
    console.log('No scenario results found in output/');

    return;
  }

  console.log(`Found ${scenarioCount} scenario(s)`);

  const mode = process.env.PERF_MODE;

  // Written by lib/setup.mjs before the scenarios ran: the Chromium build and the machine.
  const environment = await readEnvironment(OUTPUT_DIR);
  const key = currentKey(environment);

  if (environment) {
    console.log(`Environment: ${describeKey(key)}`);
  } else {
    console.warn('  WARN: no output/environment.json -- the globalSetup did not run; the snapshot will ' +
      'carry no Chromium build and the baseline cannot be selected by environment.');
  }

  // Save golden snapshots
  if (mode === 'golden') {
    const metadata = {
      commit: process.env.GITHUB_SHA || null,
      runId: process.env.GITHUB_RUN_ID || null,
      runNumber: process.env.GITHUB_RUN_NUMBER || null,
      harnessVersion: HARNESS_VERSION,
      environment,
    };
    const savedPath = await saveSnapshots(stripInternalFields(scenarioResults), metadata);

    console.log(`Golden snapshots saved to ${savedPath}`);

    // Also write to output/ for artifact upload
    await mkdir(OUTPUT_DIR, { recursive: true });
    await copyFile(savedPath, join(OUTPUT_DIR, 'snapshots.json'));
  }

  // A delta between a marked run and an auto-zoomed baseline is not a measurement of
  // anything: the two describe different slices of their traces. Say so rather than
  // letting the sticky comment publish four-figure percentages as regressions.
  const windowSourceOf = scenario => scenario.windowSource ?? 'auto-zoom';
  const versionOf = scenario => scenario.measurementVersion ?? DEFAULT_MEASUREMENT_VERSION;
  // A scenario redefined since the baseline was recorded (another `measurementVersion`) is the same
  // situation as a window mismatch -- the two sides measured different quantities under one name --
  // and is withheld through the same path. The median already filters these out per scenario; this
  // catches the single-file fallback, which is one whole golden and cannot.
  const crossWindow = (current, baseline) => Object.keys(current)
    .filter(name => baseline?.[name] && (
      windowSourceOf(baseline[name]) !== windowSourceOf(current[name])
      || versionOf(baseline[name]) !== versionOf(current[name])
    ));

  // Load golden for comparison
  let golden = null;
  let baselineUnavailable = null;

  if (mode === 'compare' || mode === 'golden') {
    // Only goldens recorded on this Chromium build, with this harness, at each scenario's current
    // measurement version may serve as the baseline. A run with no recorded environment cannot be
    // matched, so it falls back to the unkeyed selection rather than refusing everything.
    const compatibleWith = isCompleteKey(key)
      ? {
        key,
        scenarioVersions: Object.fromEntries(
          Object.entries(scenarioResults).map(([name, data]) => [name, data.measurementVersion])
        ),
      }
      : null;
    const loaded = await loadBaseline(undefined, {
      compatibleWith,
      // In golden mode the single-file golden is the snapshot this very run just saved, and a
      // develop run compared against itself reports 0% on every row. History or nothing.
      allowSingleFile: mode !== 'golden',
    });

    golden = loaded.snapshot;
    baselineUnavailable = loaded.unavailableReason;

    if (golden) {
      const goldenCount = Object.keys(golden.scenarios || {}).length;

      if (golden.isMedian) {
        console.log(
          `Golden baseline is a median of ${golden.medianWindowSize} compatible develop run(s), ` +
          `newest ${golden.timestamp} (${goldenCount} scenarios). Source runs: ` +
          `${(golden.medianSourceTimestamps || []).join(', ')}`
        );
      } else {
        console.log(`Golden baseline loaded (${goldenCount} scenarios from ${golden.timestamp})`);
      }
    } else if (baselineUnavailable) {
      console.warn(`\n  WARN: no comparable baseline -- ${baselineUnavailable}\n`);
    }

    if (!golden && mode === 'compare') {
      // Self-compare: use current results as golden so charts always render
      console.log('No golden baseline found -- self-comparing for chart preview');

      golden = {
        timestamp: new Date().toISOString(),
        // Marked explicitly. The reports must not describe this as a develop baseline: every delta
        // against it is 0% by construction, and a timestamp alone is indistinguishable from a real
        // single-run golden, which would let "within tolerance" be claimed for a run compared
        // against itself.
        isSelfCompare: true,
        scenarios: stripInternalFields(scenarioResults),
      };
    }
  }

  const mismatched = golden ? crossWindow(scenarioResults, golden.scenarios || {}) : [];

  if (mismatched.length > 0) {
    console.warn(
      `\n  WARN: ${mismatched.length} scenario(s) are being compared against a baseline measured ` +
      `over a different window or at a different measurementVersion -- ${mismatched.join(', ')}. ` +
      'The deltas below are not measurements of a code change; they are the two windows disagreeing. ' +
      'A fresh golden run on develop clears this.\n'
    );
  }

  // Build reports
  const meta = {
    prNumber: process.env.PR_NUMBER || null,
    branch: process.env.GITHUB_HEAD_REF || (mode === 'golden' ? 'develop' : 'unknown'),
    baseBranch: 'develop',
    pagesUrl: process.env.PAGES_URL || null,
    crossWindowScenarios: mismatched,
    // PERF_COMMIT_SHA is the PR head on the pull_request path, where GITHUB_SHA is the ephemeral
    // merge commit that exists on no branch. See the env block in performance-tests.yml.
    commit: process.env.PERF_COMMIT_SHA || process.env.GITHUB_SHA || null,
    runId: process.env.GITHUB_RUN_ID || null,
    environment,
    baselineUnavailable,
  };

  const report = buildReport(scenarioResults, golden, meta);
  const htmlReport = buildHtmlReport(scenarioResults, golden, meta);

  // Write to output/
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(join(OUTPUT_DIR, 'result.md'), report, 'utf8');
  await writeFile(join(OUTPUT_DIR, 'report.html'), htmlReport, 'utf8');

  // On develop, a regression against the trailing median is the develop push's own news. Annotate
  // the run so it is seen where it happened; the snapshot is still deployed as recorded.
  if (mode === 'golden' && golden) {
    annotateRegressions(collectRegressions(scenarioResults, golden, meta), golden);
  }

  console.log('\nReports written to output/result.md and output/report.html\n');
  console.log(report);
}
