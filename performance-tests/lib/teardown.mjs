// Playwright globalTeardown -- parse all trace files, average per scenario,
// build the markdown report, and optionally save/compare golden snapshots.

import { readdir, readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { join } from 'node:path';

import { parseTrace, averageParsedTraces } from '../trace-parser.mjs';
import { saveSnapshots, loadSnapshots } from './snapshot-store.mjs';
import { buildReport } from './report-builder.mjs';
import { buildHtmlReport } from './html-report-builder.mjs';

const OUTPUT_DIR = join(import.meta.dirname, '..', 'output');

const exists = p => access(p).then(() => true, () => false);

async function collectScenarioResults() {
  if (!await exists(OUTPUT_DIR)) {
    return {};
  }

  const results = {};
  const entries = await readdir(OUTPUT_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) { continue; }

    const scenarioDir = join(OUTPUT_DIR, entry.name);
    const allFiles = await readdir(scenarioDir);
    const traceFiles = allFiles
      .filter(f => f.startsWith('iteration-') && f.endsWith('.json'))
      .sort()
      .map(f => join(scenarioDir, f));

    if (traceFiles.length === 0) { continue; }

    // Parse each iteration
    const parsedResults = [];

    for (const fp of traceFiles) {
      const text = await readFile(fp, 'utf8');

      parsedResults.push(parseTrace(JSON.parse(text)));
    }

    // Collect per-iteration values for CV% calculation
    const iterationValues = collectIterationValues(parsedResults);

    // Average across iterations
    const averaged = averageParsedTraces(parsedResults);

    averaged._iterationValues = iterationValues;

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
      for (const k of Object.keys(r.categories)) { catKeys.add(k); }
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
    // Strip _iterationValues before saving (internal-only)
    const cleanResults = {};

    for (const [name, data] of Object.entries(scenarioResults)) {
      const { _iterationValues, ...rest } = data;

      cleanResults[name] = rest;
    }

    const savedPath = await saveSnapshots(cleanResults);

    console.log(`Golden snapshots saved to ${savedPath}`);

    // Also write to output/ for artifact upload
    await mkdir(OUTPUT_DIR, { recursive: true });
    await copyFile(savedPath, join(OUTPUT_DIR, 'snapshots.json'));
  }

  // Load golden for comparison
  let golden = null;

  if (mode === 'compare' || mode === 'golden') {
    golden = await loadSnapshots();

    if (golden) {
      const goldenCount = Object.keys(golden.scenarios || {}).length;

      console.log(`Golden baseline loaded (${goldenCount} scenarios from ${golden.timestamp})`);
    } else if (mode === 'compare') {
      // Self-compare: use current results as golden so charts always render
      console.log('No golden baseline found -- self-comparing for chart preview');

      const selfBaseline = {};

      for (const [name, data] of Object.entries(scenarioResults)) {
        const { _iterationValues, ...rest } = data;

        selfBaseline[name] = rest;
      }

      golden = { timestamp: new Date().toISOString(), scenarios: selfBaseline };
    }
  }

  // Build reports
  const meta = {
    prNumber: process.env.PR_NUMBER || null,
    branch: process.env.GITHUB_HEAD_REF || (mode === 'golden' ? 'develop' : 'unknown'),
    baseBranch: 'develop',
    pagesUrl: process.env.PAGES_URL || null,
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
