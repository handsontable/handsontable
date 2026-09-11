#!/usr/bin/env node

/**
 * Collects one workflow run's flaky and failed tests into the cross-run ledger.
 *
 * Reads the run's downloaded artifacts (one directory per artifact), extracts
 * every flaky or failed test from the Playwright JSON reports and the Puppeteer
 * failed-specs records, merges them into the ledger checked out from `gh-pages`,
 * and writes the ledger, the per-test summary and the page next to it. Prints
 * the step-summary Markdown to stdout.
 *
 * Never fails the job over its input: an artifact that does not parse is noted
 * and skipped, and a run with nothing to record still rewrites the summary and
 * the page (the windows move with time). The only errors are the caller's own —
 * a missing argument or an unreadable run file.
 *
 * All decisions live in `./lib/test-health.mjs`, which is pure and unit-tested;
 * this wrapper only reads and writes files.
 *
 * Usage:
 *   node .github/scripts/test-health-collect.mjs \
 *     --run run.json            # the workflow_run payload or the runs API response
 *     --artifacts artifacts     # <dir>/<artifact name>/... as `gh run download` lays them out
 *     --ledger-dir <gh-pages worktree>/test-health
 *     [--seed .github/test-health/seed.json]
 *     [--template .github/test-health/index.template.html]
 *     [--page-url https://handsontable.github.io/handsontable/test-health/]
 *     [--now 2026-09-08T12:00:00Z]   # for tests
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  aggregate,
  collectArtifactFiles,
  emptyLedger,
  entryKey,
  mergeLedger,
  renderPage,
  renderStepSummary,
  runContextFromRun,
  stableGeneratedAt,
} from './lib/test-health.mjs';

const DEFAULT_PAGE_URL = 'https://handsontable.github.io/handsontable/test-health/';

/**
 * `--name value` pairs from argv.
 *
 * @param {string[]} argv The arguments.
 * @returns {Record<string, string>} The options.
 */
function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      const inline = name.indexOf('=');

      if (inline !== -1) {
        options[name.slice(0, inline)] = name.slice(inline + 1);
      } else {
        options[name] = argv[index + 1];
        index += 1;
      }
    }
  }

  return options;
}

/**
 * Every file under `dir`, recursively, as paths relative to `dir`.
 *
 * @param {string} dir The directory.
 * @returns {string[]} The relative paths, POSIX-separated.
 */
function listFiles(dir) {
  const files = [];
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const full = path.join(current, name);

      if (statSync(full).isDirectory()) {
        walk(full);
      } else {
        files.push(path.relative(dir, full).split(path.sep).join('/'));
      }
    }
  };

  walk(dir);

  return files;
}

/**
 * The JSON files of every artifact directory, tagged with their artifact.
 *
 * @param {string} artifactsDir The directory holding one subdirectory per artifact.
 * @returns {Array<{artifact: string, path: string, text: string}>} The files.
 */
function readArtifactFiles(artifactsDir) {
  if (!existsSync(artifactsDir)) {
    return [];
  }

  const files = [];

  for (const artifact of readdirSync(artifactsDir)) {
    const dir = path.join(artifactsDir, artifact);

    if (!statSync(dir).isDirectory()) {
      continue;
    }

    for (const relative of listFiles(dir)) {
      if (relative.endsWith('.json')) {
        files.push({ artifact, path: relative, text: readFileSync(path.join(dir, relative), 'utf8') });
      }
    }
  }

  return files;
}

/**
 * The entries of the seed file, stamped as hand-recorded. A seed entry carries
 * its own run fields; `source` is forced so the page can tell it apart.
 *
 * @param {string|undefined} seedPath The path, when given.
 * @returns {object[]} The entries, or none.
 */
function readSeed(seedPath) {
  if (!seedPath || !existsSync(seedPath)) {
    return [];
  }

  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));

  return (seed.entries ?? []).map(entry => ({ ...entry, source: 'seed' }));
}

const options = parseArgs(process.argv.slice(2));

for (const required of ['run', 'artifacts', 'ledger-dir']) {
  if (!options[required]) {
    process.stderr.write(`Missing --${required}\n`);
    process.exit(2);
  }
}

const now = options.now ? new Date(options.now) : new Date();
const run = runContextFromRun(JSON.parse(readFileSync(options.run, 'utf8')));
const ledgerPath = path.join(options['ledger-dir'], 'ledger.json');
const existing = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : emptyLedger();
const { entries, notes } = collectArtifactFiles(readArtifactFiles(options.artifacts), run);
// A seed the ledger already holds must not overwrite the richer CI observation with its own
// `error: null`, `source: 'seed'` copy — merge only the seeds that are new.
const existingKeys = new Set((existing.entries ?? []).map(entryKey));
const seeded = readSeed(options.seed).filter(entry => !existingKeys.has(entryKey(entry)));
const { ledger, added } = mergeLedger(existing, [...seeded, ...entries], { now });
const summaryPath = path.join(options['ledger-dir'], 'summary.json');
let previousSummary = null;

if (existsSync(summaryPath)) {
  try {
    previousSummary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  } catch {
    previousSummary = null;
  }
}

const aggregated = aggregate(ledger, { now });
const summary = { ...aggregated, generatedAt: stableGeneratedAt(previousSummary, aggregated, now) };
const pageUrl = options['page-url'] ?? DEFAULT_PAGE_URL;

mkdirSync(options['ledger-dir'], { recursive: true });
writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

if (options.template) {
  const template = readFileSync(options.template, 'utf8');

  writeFileSync(path.join(options['ledger-dir'], 'index.html'), renderPage(template, summary));
}

// Seed entries are not "this run's" additions; keep the step summary about the run.
const addedFromRun = added.filter(entry => entry.source === 'ci');

process.stdout.write(renderStepSummary({ run, added: addedFromRun, notes, summary, pageUrl }));
