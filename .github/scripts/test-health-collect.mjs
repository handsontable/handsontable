#!/usr/bin/env node

/**
 * Collects one workflow run's flaky and failed tests into the cross-run ledger,
 * and its Playwright legs' durations into the durations document beside it.
 *
 * Reads the run's downloaded artifacts (one directory per artifact), extracts
 * every flaky or failed test from the Playwright JSON reports, the Puppeteer
 * failed-specs records, and the visual compare records, merges them into the
 * ledger checked out from `gh-pages`,
 * and writes the ledger, the per-test summary and the page next to it. The
 * fourth artifact family, `playwright-durations-*` (every Playwright leg, green
 * or red), goes to `durations.json` instead, from develop pushes only: per run
 * and leg the wall-clock, workers and counts for 30 days, and the per-test
 * milliseconds of each leg's latest run, which the page's "Where the time goes"
 * section draws. A durations.json it cannot read is left as it is, with a
 * warning, and never stops the ledger. The fifth family, the accessibility
 * nightlies' evidence (`a11y-checks-evidence`, `a11y-axe-results`,
 * `screenreader-transcripts-*`) and the docs site scan's findings
 * (`docs-a11y-axe-results`), goes to `a11y.json`, from those workflows'
 * develop runs only (`isA11yRun`): one row per finding across nights, sorted
 * into root-cause clusters by the catalog `--catalog` names
 * (`tests/a11y/issues.json`), which the page's "Accessibility" section draws.
 * A row that matches two clusters, or a night with more triage shapes than the
 * catalog's `triageLimit`, raises a `::warning`. An a11y.json it cannot read,
 * or a catalog that does not validate, is left as it is, with a warning, and
 * never stops the ledger. Prints the step-summary Markdown to stdout.
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
 *     --ledger-dir <gh-pages worktree>/test-health   # ledger.json, summary.json, durations.json, a11y.json, index.html
 *     [--seed .github/test-health/seed.json]
 *     [--template .github/test-health/index.template.html]
 *     [--catalog tests/a11y/issues.json]   # without it, accessibility findings are not recorded
 *     [--page-url https://handsontable.github.io/handsontable/test-health/]
 *     [--now 2026-09-08T12:00:00Z]   # for tests
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  assertDurationsVersion,
  durationsView,
  isDevelopPush,
  mergeDurations,
  serializeDurations,
} from './lib/playwright-durations.mjs';
import {
  a11yView,
  assertA11yVersion,
  isA11yRun,
  mergeA11yLedger,
  readA11yArtifacts,
  serializeA11yLedger,
} from './lib/a11y-ledger.mjs';
import { compileIssuesCatalog } from '../../tests/lib/a11y-issues.mjs';
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
const { entries, notes, durations, a11y: a11yFiles } = collectArtifactFiles(readArtifactFiles(options.artifacts), run);
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

const durationsPath = path.join(options['ledger-dir'], 'durations.json');
let durationsText = null;
let durationsPage = null;
let recorded = [];

// The durations half never stops the flake ledger and never overwrites a file it cannot read. On any error
// durations.json stays as it is (a month of history is not rebuilt from one run), the page and the step
// summary name the error, and a warning flags the run; the ledger is recorded either way.
try {
  const previousDurations = existsSync(durationsPath) ? JSON.parse(readFileSync(durationsPath, 'utf8')) : null;

  if (isDevelopPush(run)) {
    const timing = mergeDurations(previousDurations, durations, run, { now });

    notes.push(...timing.notes);
    recorded = timing.recorded;
    durationsText = serializeDurations(timing.doc);
    durationsPage = durationsView(timing.doc);
  } else {
    // Only develop pushes are recorded: they are what the budget and the page measure against, and a pull
    // request's run then commits to gh-pages only when it records a flake, as before the durations existed.
    assertDurationsVersion(previousDurations);
    durationsPage = durationsView(previousDurations);

    if (durations.length > 0) {
      notes.push(`${durations.length} Playwright durations artifact(s) not recorded: only develop pushes are, `
        + 'and this run keeps its own for 3 days');
    }
  }
} catch (error) {
  const reason = String(error.message).replace(/\s+/g, ' ');

  durationsText = null;
  durationsPage = { error: reason };
  recorded = [];
  notes.push(`durations.json was left as it is: ${reason}`);
  process.stderr.write(`::warning title=Test health::durations.json was left as it is: ${reason}\n`);
}

const a11yPath = path.join(options['ledger-dir'], 'a11y.json');
let a11yText = null;
let a11yPage = null;
let a11yRecorded = [];
const a11yWarnings = [];

// The accessibility half follows the durations half's rule: it never stops the flake ledger and never overwrites
// a file it cannot read. On any error a11y.json stays as it is, the page and the step summary name the error,
// and a warning flags the run.
try {
  const previousA11y = existsSync(a11yPath) ? JSON.parse(readFileSync(a11yPath, 'utf8')) : null;

  if (!options.catalog) {
    assertA11yVersion(previousA11y);
    a11yPage = { error: 'no --catalog: the cluster catalog (tests/a11y/issues.json) is what sorts the findings' };
    notes.push('no --catalog: accessibility findings not recorded');
  } else {
    const catalog = compileIssuesCatalog(JSON.parse(readFileSync(options.catalog, 'utf8')));

    if (isA11yRun(run)) {
      const read = readA11yArtifacts(a11yFiles);
      let doc = previousA11y;
      let changed = false;

      notes.push(...read.notes);

      for (const night of read.nights) {
        const merged = mergeA11yLedger(doc, night, run, catalog, { now });

        doc = merged.doc;
        changed = changed || merged.changed;
        notes.push(...merged.notes);

        // The catalog's guarantees are tested against a sampled night; a live night that breaks one says so on
        // the run, where whoever reads the step summary sees it, not only in the notes.
        for (const { clusters, rows } of merged.ambiguous) {
          a11yWarnings.push(`${rows} accessibility row(s) match clusters ${clusters.join(', ')}: tests/a11y/issues.json needs one rule per finding`);
        }
        if (merged.recorded) {
          a11yRecorded.push(merged.recorded);

          if (merged.recorded.triageShapes > catalog.triageLimit) {
            const over = `the ${merged.recorded.source} night ${merged.recorded.runId} has ${merged.recorded.triageShapes} finding shape(s) `
              + `in needs-triage, over the catalog's triageLimit of ${catalog.triageLimit}: sort them into clusters in tests/a11y/issues.json`;

            notes.push(over);
            a11yWarnings.push(over);
          }
        }
      }
      if (changed) {
        a11yText = serializeA11yLedger(doc);
      } else {
        assertA11yVersion(previousA11y);
      }
      a11yPage = a11yView(doc, catalog);
    } else {
      // Only the two nightlies' and the docs site scan's runs on develop are recorded: a pull request's evidence, a
      // fork's included, comes from the pull request's own code and stays in its own run.
      assertA11yVersion(previousA11y);
      a11yPage = a11yView(previousA11y, catalog);

      if (a11yFiles.length > 0) {
        notes.push(`${a11yFiles.length} accessibility artifact file(s) not recorded: only the A11y and Screen reader nightlies `
          + 'and the docs site scan on develop are, and this run keeps its own');
      }
    }
  }
} catch (error) {
  const reason = String(error.message).replace(/\s+/g, ' ');

  a11yText = null;
  a11yPage = { error: reason };
  a11yRecorded = [];
  notes.push(`a11y.json was left as it is: ${reason}`);
  process.stderr.write(`::warning title=Test health::a11y.json was left as it is: ${reason}\n`);
}
for (const warning of a11yWarnings) {
  process.stderr.write(`::warning title=Test health::${warning}\n`);
}

const aggregated = aggregate(ledger, { now });
const summary = { ...aggregated, generatedAt: stableGeneratedAt(previousSummary, aggregated, now) };
const pageUrl = options['page-url'] ?? DEFAULT_PAGE_URL;

mkdirSync(options['ledger-dir'], { recursive: true });
writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

if (durationsText !== null) {
  writeFileSync(durationsPath, durationsText);
}
if (a11yText !== null) {
  writeFileSync(a11yPath, a11yText);
}

if (options.template) {
  const template = readFileSync(options.template, 'utf8');

  writeFileSync(path.join(options['ledger-dir'], 'index.html'), renderPage(template, summary, durationsPage, a11yPage));
}

// Seed entries are not "this run's" additions; keep the step summary about the run.
const addedFromRun = added.filter(entry => entry.source === 'ci');

// The legs the reducer recorded, not every artifact: a skipped leg must not show its minutes here.
process.stdout.write(renderStepSummary({
  run, added: addedFromRun, notes, summary, pageUrl, durations: recorded, a11y: a11yRecorded,
}));
