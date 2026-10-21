#!/usr/bin/env node
/**
 * Replays the flake ledger against the declared leg matrix: for every run in which a Playwright test
 * was red on a Chromium leg other than `e2e-main`, would the declared tree have run it on that leg?
 * The rules are in `tests/lib/leg-replay.mjs`; the policy is `tests/AGENTS.md` ("Declaring the legs").
 *
 * Two uses. Triage, after a red nightly: the test was red on `e2e-horizon` and is green on pull
 * requests, so does its spec declare `THEMES_TAG`?
 *
 *   npx playwright test --list --reporter=json > test-results/list.json
 *   node scripts/leg-replay.mjs --list test-results/list.json
 *
 * And proof, before a change to the declarations lands: the same command exits 1 on any miss. A
 * classification file (`{ "e2e/x.spec.ts": { "themes": true, "bundles": false }, … }`) stands in for
 * the tree before the tags are written:
 *
 *   node scripts/leg-replay.mjs --assume classification.json
 *
 * Options: `--ledger <path or URL>` (default: the published ledger), `--list <path>` (the `--list`
 * JSON of the declared tree; proof mode), `--assume <path>` (a classification; proof mode – a spec of
 * this package's `e2e/` tree the classification leaves out is the default, `e2e-main` only, never an
 * orphan, so a red off-main on it is a miss),
 * `--since YYYY-MM-DD` (entries seen before the date are left out), `--json` (the result as JSON
 * instead of Markdown). Exit codes: 0 when nothing is missed or no declared tree was given, 1 on a
 * miss, 2 on a usage error.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { projectsFromAssumption, projectsFromList, renderReplay, replay } from '../lib/leg-replay.mjs';

const LEDGER_URL = 'https://handsontable.github.io/handsontable/test-health/ledger.json';
const TESTS_ROOT = path.resolve(import.meta.dirname, '..');

const { values } = parseArgs({
  options: {
    ledger: { type: 'string', default: LEDGER_URL },
    list: { type: 'string' },
    assume: { type: 'string' },
    since: { type: 'string' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
  strict: true,
});

if (values.help) {
  process.stdout.write('node scripts/leg-replay.mjs [--ledger <path|url>] [--list <list.json>] [--assume <classification.json>] '
    + '[--since YYYY-MM-DD] [--json]\n');
  process.exit(0);
}
if (values.list && values.assume) {
  process.stderr.write('leg-replay: give --list (the declared tree) or --assume (a classification), not both.\n');
  process.exit(2);
}
if (values.since && !/^\d{4}-\d{2}-\d{2}$/.test(values.since)) {
  process.stderr.write(`leg-replay: --since takes YYYY-MM-DD, received ${JSON.stringify(values.since)}.\n`);
  process.exit(2);
}

/**
 * Every spec of this package's `e2e/` tree, relative to the package, the way the ledger names files.
 *
 * @returns {string[]} The spec paths.
 */
function specFiles() {
  const walk = (dir, out) => {
    readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full, out);
      } else if (entry.name.endsWith('.spec.ts')) {
        out.push(path.relative(TESTS_ROOT, full).split(path.sep).join('/'));
      }
    });

    return out;
  };

  return walk(path.join(TESTS_ROOT, 'e2e'), []);
}

/**
 * Reads a JSON document from a path or an http(s) URL.
 *
 * @param {string} location The path or URL.
 * @returns {Promise<object>} The parsed document.
 */
async function readJson(location) {
  if (/^https?:\/\//.test(location)) {
    const response = await fetch(location, { headers: { 'Cache-Control': 'no-cache' } });

    if (!response.ok) {
      throw new Error(`${location} answered ${response.status}`);
    }

    return response.json();
  }

  return JSON.parse(readFileSync(location, 'utf8'));
}

const ledger = await readJson(values.ledger);

if (!Array.isArray(ledger.entries)) {
  process.stderr.write(`leg-replay: ${values.ledger} is not a ledger (no "entries" array).\n`);
  process.exit(2);
}

let declared = null;
let heading = 'Ledger replay (needs only)';

if (values.list) {
  declared = projectsFromList(await readJson(values.list));
  heading = `Ledger replay against ${values.list}`;
} else if (values.assume) {
  declared = projectsFromAssumption(await readJson(values.assume), specFiles());
  heading = `Ledger replay against the classification ${values.assume}`;
}

const result = replay({ entries: ledger.entries, declared, since: values.since });

if (values.json) {
  process.stdout.write(`${JSON.stringify({
    ...result,
    filesNeedingTags: Object.fromEntries(result.filesNeedingTags),
  }, null, 2)}\n`);
} else {
  process.stdout.write(renderReplay(result, { heading: `${heading}${values.since ? ` since ${values.since}` : ''}` }));
}

process.exitCode = declared && result.misses.length > 0 ? 1 : 0;
