/**
 * Refreshes `tests/a11y/docs/docs-baseline.json` from a run of the docs site scan, in one command
 * (`tests/AGENTS.md`, "A11y: the docs site scan"):
 *
 *   node tests/scripts/a11y-docs-baseline.mjs --run <run-id>      a CI run: downloads its docs-a11y-axe-results
 *   node tests/scripts/a11y-docs-baseline.mjs --scans <folder>    a local run: tests/test-results/a11y-docs/scans
 *
 * Every docs merge can add or remove findings on the staging deploy, so the baseline goes stale with the docs.
 * The refresh (`lib/a11y-docs-baseline.mjs`) takes every count from the run, deletes what the run no longer
 * found, adds a new finding under the issue its rule and target already belong to, keeps the entries of the pages
 * the run did not scan, and drops those of a page that left the page list. It writes nothing when a scan read
 * another deploy than the staging one, or when a new finding needs an issue no entry names yet: those are listed,
 * and a person names the issue.
 *
 * `--dry-run` prints what would change and writes nothing; `--baseline <file>` names another file to rewrite
 * (the tooling test's copy). Needs `gh`, signed in, for `--run`.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { formatBaseline, refreshBaseline } from '../lib/a11y-docs-baseline.mjs';
import { DOCS_BASELINE_FILE, docsSuite } from '../lib/a11y-suites.mjs';
import { DEFAULT_DOCS_BASE_URL, DOCS_PAGES, DOCS_THEMES } from '../a11y/docs/pages.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({
  options: {
    run: { type: 'string' },
    scans: { type: 'string' },
    baseline: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

if (Boolean(values.run) === Boolean(values.scans)) {
  fail('name one source: --run <run-id> (a CI run of Docs a11y) or --scans <folder> (a local run\'s scans).');
}
if (values.run !== undefined && !/^\d+$/.test(values.run)) {
  fail(`--run takes a run id (digits only), got ${JSON.stringify(values.run)}.`);
}

const baselinePath = path.resolve(values.baseline ?? path.join(TESTS_ROOT, DOCS_BASELINE_FILE));
const shownPath = path.relative(process.cwd(), baselinePath).startsWith('..') ? baselinePath : path.relative(process.cwd(), baselinePath);
const download = values.run ? mkdtempSync(path.join(tmpdir(), 'docs-a11y-baseline-')) : null;

try {
  if (download) {
    execFileSync('gh', ['run', 'download', values.run, '--name', docsSuite().artifact, '--dir', download], { stdio: 'inherit' });
  }

  const folder = download ? path.join(download, 'scans') : path.resolve(values.scans);
  const scans = readdirSync(folder).filter(name => name.endsWith('.json')).sort()
    .map(name => JSON.parse(readFileSync(path.join(folder, name), 'utf8')));
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const { document, changes, unplaced, problems } = refreshBaseline({
    baseline,
    scans,
    pages: DOCS_PAGES.map(page => page.id),
    themes: DOCS_THEMES,
    baseUrl: DEFAULT_DOCS_BASE_URL,
    baselineFile: DOCS_BASELINE_FILE,
  });

  report(changes, scans.length, values.run ? `run ${values.run}` : folder);
  for (const entry of unplaced) {
    process.stdout.write(`  needs an issue: ${JSON.stringify(entry)}\n`);
  }
  if (document === null) {
    // Not `fail()`: `process.exit()` would skip the `finally` that removes the download.
    process.stderr.write(`a11y-docs-baseline: nothing written:\n${problems.map(problem => `  - ${problem}`).join('\n')}\n`);
    process.exitCode = 1;
  } else if (values['dry-run']) {
    process.stdout.write(`--dry-run: ${shownPath} not written.\n`);
  } else {
    writeFileSync(baselinePath, formatBaseline(document));
    process.stdout.write(`Wrote ${shownPath}: ${document.entries.length} entries under `
      + `${document.issues.length} issues.\n`);
  }
} finally {
  if (download) {
    rmSync(download, { recursive: true, force: true });
  }
}

/**
 * Prints what the refresh changes, one line per kind and one per entry.
 *
 * @param {object} changes What `refreshBaseline()` returned as `changes`.
 * @param {number} scanCount How many scans the run holds.
 * @param {string} source The run or the folder.
 */
function report(changes, scanCount, source) {
  const line = entry => `${entry.page} ${entry.theme} ${entry.rule} ${entry.target}`;
  const lines = [
    `${scanCount} scans from ${source}.`,
    `  added ${changes.added.length}, raised ${changes.raised.length}, lowered ${changes.lowered.length}, `
      + `impact changed ${changes.impact.length}, removed ${changes.removed.length}, dropped with their page ${changes.unlisted.length}; `
      + `${changes.unverified} kept unverified (page not scanned).`,
    ...changes.added.map(entry => `  + ${line(entry)}: ${entry.nodes} (${entry.issue})`),
    ...changes.raised.map(entry => `  ↑ ${line(entry)}: ${entry.from} → ${entry.nodes}`),
    ...changes.lowered.map(entry => `  ↓ ${line(entry)}: ${entry.from} → ${entry.nodes}`),
    ...changes.impact.map(entry => `  ! ${line(entry)}: impact ${entry.from} → ${entry.impact}`),
    ...changes.removed.map(entry => `  - ${line(entry)}: ${entry.nodes} (${entry.issue})`),
    ...changes.unlisted.map(entry => `  - ${line(entry)}: ${entry.nodes} (${entry.issue}), its page left the page list`),
    ...changes.removedIssues.map(id => `  - issue ${id}: no entry left`),
    ...(changes.engine ? [`  axe-core ${changes.engine.from} → ${changes.engine.to}`] : []),
  ];

  process.stdout.write(`${lines.join('\n')}\n`);
}

/**
 * Prints the reason and exits 1.
 *
 * @param {string} message The reason.
 */
function fail(message) {
  process.stderr.write(`a11y-docs-baseline: ${message}\n`);
  process.exit(1);
}
