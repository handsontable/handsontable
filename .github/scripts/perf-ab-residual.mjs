#!/usr/bin/env node
//
// TEMPORARY. Delete alongside .github/workflows/perf-ab-calibration.yml.
//
// Reads the paired snapshots that workflow produces and prints, as markdown, how far apart two
// runs of the same code on the same runner land. Every number here is noise by construction: both
// halves of a pair measured a byte-identical build.
//
// Deliberately reuses sumActive() and calcCv() from the shipped threshold module rather than
// reimplementing them, so the residual is computed exactly the way the report computes a delta.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { sumActive, calcCv } from '../../performance-tests/lib/thresholds.mjs';

// The bands the plan commits to acting on, so the workflow states a verdict rather than leaving it
// to whoever reads the table.
const VERDICTS = [
  [3, 'PASS -- design validated. Use this spread to set REGRESSION_CALLOUT_THRESHOLD_TIMING.'],
  [8, 'PARTIAL -- A/B helps but does not close it. Interleave the halves and re-measure.'],
  [Infinity, 'FAIL -- do not write the CI wiring. The approach needs rethinking.'],
];

/**
 * @param {string} dir
 * @returns {Map<string, Record<string, object>>} pair id -> { a, b } snapshots
 */
function loadPairs(dir) {
  const pairs = new Map();

  for (const file of readdirSync(dir).sort()) {
    const match = /^(pair\d+)-([ab])\.json$/.exec(file);

    if (!match) {
      continue;
    }

    const [, pair, half] = match;

    if (!pairs.has(pair)) {
      pairs.set(pair, {});
    }

    pairs.get(pair)[half] = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
  }

  return pairs;
}

/**
 * @param {Map<string, Record<string, object>>} pairs
 * @returns {Map<string, number[]>} scenario -> signed percentage deltas, one per complete pair
 */
function deltasByScenario(pairs) {
  const deltas = new Map();

  for (const [pair, { a, b }] of pairs) {
    if (!a || !b) {
      console.error(`Skipping ${pair}: only one half present.`);
      continue;
    }

    for (const [scenario, aEntry] of Object.entries(a.scenarios || {})) {
      const bEntry = b.scenarios?.[scenario];

      if (!bEntry) {
        continue;
      }

      const aTotal = sumActive(aEntry.categories || {});
      const bTotal = sumActive(bEntry.categories || {});

      if (!(aTotal > 0)) {
        continue;
      }

      if (!deltas.has(scenario)) {
        deltas.set(scenario, []);
      }

      deltas.get(scenario).push(((bTotal - aTotal) / aTotal) * 100);
    }
  }

  return deltas;
}

const dir = process.argv[2];

if (!dir) {
  console.error('usage: perf-ab-residual.mjs <dir>');
  process.exit(1);
}

const pairs = loadPairs(dir);
const deltas = deltasByScenario(pairs);

if (deltas.size === 0) {
  console.log('## Perf A/B calibration\n\nNo complete pairs found.');
  process.exit(1);
}

const rows = [...deltas.entries()]
  .map(([scenario, values]) => {
    const worst = Math.max(...values.map(Math.abs));

    return { scenario, values, worst };
  })
  .sort((x, y) => y.worst - x.worst);

const overallWorst = Math.max(...rows.map(r => r.worst));
const verdict = VERDICTS.find(([limit]) => overallWorst <= limit)[1];

console.log('## Perf A/B calibration\n');
console.log(`Both halves of every pair measured the same build, so **every number below is noise**.`);
console.log(`Pairs: ${pairs.size}.\n`);
console.log('```');
console.log(`${'scenario'.padEnd(30)}${'worst |Δ|'.padStart(11)}${'deltas'.padStart(10)}`);

for (const { scenario, values, worst } of rows) {
  const rendered = values.map(v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`).join(' ');

  console.log(`${scenario.padEnd(30)}${`${worst.toFixed(1)}%`.padStart(11)}   ${rendered}`);
}

console.log('```\n');
console.log(`Worst residual across all scenarios: **${overallWorst.toFixed(1)}%**\n`);
console.log(`**${verdict}**\n`);

// Only meaningful with more than one pair: how repeatable the residual itself is.
if (pairs.size > 1) {
  console.log('Per-scenario spread of the residual across pairs:\n');
  console.log('```');

  for (const { scenario, values } of rows) {
    const cv = calcCv(values);

    console.log(`${scenario.padEnd(30)}${(cv == null ? 'n/a' : `${cv.toFixed(1)}%`).padStart(8)}`);
  }

  console.log('```');
}
