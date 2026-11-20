#!/usr/bin/env node

/**
 * The accessibility digest: what improved and what declined in the findings ledger between two published states.
 *
 * Reads the ledger as it is published now (`--after`) and as it was published a week before (`--before`, optional: a
 * first digest has none), words the difference for Slack (`./lib/a11y-digest.mjs`, which is pure and unit-tested), prints
 * the text, and writes the message's payload when `--payload` names a file. It posts nothing itself: the workflow's
 * Slack step sends the payload file, so the text never passes through a shell or a YAML string.
 *
 * Both files are `test-health/a11y.json` from `gh-pages`, read by `.github/workflows/a11y-digest.yml` through the
 * GitHub API. Either may be of an older ledger version: the lib reads it through the ledger's migration.
 *
 * Exit status: 0 with a digest; 2 for the caller's own errors (a missing argument, a file that cannot be read or is not
 * JSON, a catalog that does not validate). A ledger with no audit is a digest that says so, never an error.
 *
 * Usage:
 *   node .github/scripts/a11y-digest.mjs \
 *     --after after.json                      # test-health/a11y.json at the head of gh-pages
 *     [--before before.json]                  # the same file, as published `--days` ago; absent or empty: a first digest
 *     --catalog tests/a11y/issues.json
 *     [--days 7]
 *     [--page-url https://handsontable.github.io/handsontable/test-health/#a11y-fix-title]
 *     [--tracker-url https://tracker.example/t/]   # a task id is appended; without it tasks are named, not linked
 *     [--payload slack-payload.json]          # the Slack message, as JSON: { "text": "…" }
 */

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { DIGEST_DAYS, DIGEST_PAGE_URL, a11yDigest, renderA11yDigest } from './lib/a11y-digest.mjs';
import { compileIssuesCatalog } from '../../tests/lib/a11y-issues.mjs';

/**
 * Ends the script over one of the caller's own errors.
 *
 * @param {string} message What is wrong.
 */
function refuse(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

/**
 * A JSON file, parsed, or the script's end with the file named.
 *
 * @param {string} file The path.
 * @param {string} what What the file is, for the message.
 * @returns {unknown} The parsed content.
 */
function readJson(file, what) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    return refuse(`Cannot read ${what} (${file}): ${String(error.message).replace(/\s+/g, ' ')}`);
  }
}

let options;

try {
  ({ values: options } = parseArgs({
    options: {
      after: { type: 'string' },
      before: { type: 'string' },
      catalog: { type: 'string' },
      days: { type: 'string', default: String(DIGEST_DAYS) },
      'page-url': { type: 'string', default: DIGEST_PAGE_URL },
      'tracker-url': { type: 'string' },
      payload: { type: 'string' },
    },
  }));
} catch (error) {
  refuse(String(error.message));
}

for (const required of ['after', 'catalog']) {
  if (!options[required]) {
    refuse(`Missing --${required}`);
  }
}

const days = Number(options.days);

if (!Number.isInteger(days) || days < 1 || days > 366) {
  refuse(`--days must be a whole number of days from 1 to 366, got ${JSON.stringify(options.days)}`);
}

let catalog;

try {
  catalog = compileIssuesCatalog(readJson(options.catalog, 'the cluster catalog'));
} catch (error) {
  refuse(String(error.message));
}

// No earlier state is a first digest: the workflow leaves the file out, or empty, when gh-pages holds none that old.
const hasBefore = Boolean(options.before) && existsSync(options.before) && statSync(options.before).size > 0;
let text;

try {
  const digest = a11yDigest(hasBefore ? readJson(options.before, 'the earlier ledger') : null, readJson(options.after, 'the ledger'), catalog, { days });

  text = renderA11yDigest(digest, { pageUrl: options['page-url'], trackerUrl: options['tracker-url'] ?? null });
} catch (error) {
  // A ledger of a version this code does not read, most likely: say so rather than post a wrong digest.
  refuse(`Cannot build the digest: ${String(error.message).replace(/\s+/g, ' ')}`);
}

if (options.payload) {
  writeFileSync(options.payload, `${JSON.stringify({ text })}\n`);
}

process.stdout.write(`${text}\n`);
