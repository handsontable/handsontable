// Playwright globalTeardown -- parse all trace files, average per scenario,
// build the markdown report, and optionally save/compare golden snapshots.

import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseTrace, averageParsedTraces } from '../trace-parser.mjs';
import { exists } from './fs-utils.mjs';
import { saveSnapshots, loadSnapshots } from './snapshot-store.mjs';
import { buildReport } from './report-builder.mjs';
import { buildHtmlReport } from './html-report-builder.mjs';

const OUTPUT_DIR = join(import.meta.dirname, '..', 'output');

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

    // Load hook timing if saved alongside traces
    const hookTimingPath = join(scenarioDir, 'hook-timing.json');

    if (await exists(hookTimingPath)) {
      const hookData = JSON.parse(await readFile(hookTimingPath, 'utf8'));

      averaged.hookTiming = hookData.averageDeltaMs ?? null;
      averaged._iterationValues.hookTiming = hookData.deltas ?? [];
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
    values.categories[key] = parsedResults
      .map(r => r.categories?.[key])
      .filter(v => typeof v === 'number');
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

  // Save golden snapshots
  if (mode === 'golden') {
    const metadata = {
      commit: process.env.GITHUB_SHA || null,
      runId: process.env.GITHUB_RUN_ID || null,
      runNumber: process.env.GITHUB_RUN_NUMBER || null,
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
  const crossWindow = (current, baseline) => Object.keys(current)
    .filter(name => baseline?.[name] && windowSourceOf(baseline[name]) !== windowSourceOf(current[name]));

  // Load golden for comparison
  let golden = null;

  if (mode === 'compare' || mode === 'golden') {
    golden = await loadSnapshots();

    if (golden) {
      const goldenCount = Object.keys(golden.scenarios || {}).length;

      if (golden.medianWindowSize) {
        console.log(
          `Golden baseline is a median of ${golden.medianWindowSize} marks-valid develop run(s), ` +
          `newest ${golden.timestamp} (${goldenCount} scenarios)`
        );
      } else {
        console.log(`Golden baseline loaded (${goldenCount} scenarios from ${golden.timestamp})`);
      }
    } else if (mode === 'compare') {
      // Self-compare: use current results as golden so charts always render
      console.log('No golden baseline found -- self-comparing for chart preview');

      golden = {
        timestamp: new Date().toISOString(),
        scenarios: stripInternalFields(scenarioResults),
      };
    }
  }

  const mismatched = golden ? crossWindow(scenarioResults, golden.scenarios || {}) : [];

  if (mismatched.length > 0) {
    console.warn(
      `\n  WARN: ${mismatched.length} scenario(s) are being compared against a baseline measured ` +
      `over a different window -- ${mismatched.join(', ')}. ` +
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
  };

  const report = buildReport(scenarioResults, golden, meta);
  const htmlReport = buildHtmlReport(scenarioResults, golden, meta);

  // Write to output/
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(join(OUTPUT_DIR, 'result.md'), report, 'utf8');
  await writeFile(join(OUTPUT_DIR, 'report.html'), htmlReport, 'utf8');

  console.log('\nReports written to output/result.md and output/report.html\n');
  console.log(report);
}
