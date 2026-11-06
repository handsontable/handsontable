/**
 * Pins the "Minimum versions" table of the supported-browsers guide to `BROWSERS_LIST` in
 * `browser-targets.js`. The floor once moved with no docs change at all, so a reader on an older
 * browser learned about it only when the grid broke. The last column of the table is the release
 * the floor belongs to; when `BROWSERS_LIST` moves, that column (or a new one) moves with it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const { BROWSERS_LIST } = require('../../browser-targets.js');

const GUIDE = 'docs/content/guides/technical-specification/supported-browsers/supported-browsers.md';
const MIGRATION_GUIDES = 'docs/content/guides/upgrade-and-migration';

// The guide names browsers for readers, `BROWSERS_LIST` names them for browserslist.
const ROW_FOR_TARGET = {
  Chrome: 'Chrome',
  Edge: 'Edge',
  Firefox: 'Firefox',
  Safari: 'Safari (macOS)',
  iOS: 'Safari (iOS)',
};

/**
 * Reads the rows of the first table under the `## Minimum versions` heading.
 *
 * @param {string} markdown The guide's source.
 * @returns {{ header: string[], rows: string[][] }} The header cells and the body rows' cells.
 */
function readMinimumVersionsTable(markdown) {
  const section = markdown.split(/^## Minimum versions$/m)[1];

  assert.ok(section, `${GUIDE} has no "## Minimum versions" section`);

  const lines = section.split('\n').map(line => line.trim());
  const start = lines.findIndex(line => line.startsWith('|'));
  const tableLines = [];

  for (let i = start; i >= 0 && i < lines.length && lines[i].startsWith('|'); i += 1) {
    tableLines.push(lines[i]);
  }

  assert.ok(tableLines.length >= 3, `${GUIDE}: the "Minimum versions" section has no table with rows`);

  const cells = line => line.slice(1, -1).split('|').map(cell => cell.trim());
  const [header, , ...rows] = tableLines.map(cells);

  return { header, rows };
}

/**
 * Splits a `BROWSERS_LIST` entry such as `'Safari >= 18.2'` into its name and version.
 *
 * @param {string} entry A `BROWSERS_LIST` entry.
 * @returns {{ name: string, version: string }} The browserslist name and the version.
 */
function parseTarget(entry) {
  const match = /^(\S+) >= (\d+(?:\.\d+)?)$/.exec(entry);

  assert.ok(match, `unexpected BROWSERS_LIST entry: ${entry}`);

  return { name: match[1], version: match[2] };
}

const { header, rows } = readMinimumVersionsTable(readFileSync(path.join(ROOT, GUIDE), 'utf8'));
const targets = BROWSERS_LIST.map(parseTarget);

test('the guide lists every BROWSERS_LIST browser at its floor in the last column', () => {
  assert.ok(targets.length > 0, 'BROWSERS_LIST is empty');
  assert.equal(new Set(rows.map(row => row[0])).size, rows.length, `${GUIDE}: a browser has two rows`);

  const latest = Object.fromEntries(rows.map(row => [row[0], row.at(-1)]));
  const expected = Object.fromEntries(targets.map(({ name, version }) => {
    assert.ok(ROW_FOR_TARGET[name], `add a row name for the "${name}" target to ROW_FOR_TARGET`);

    return [ROW_FOR_TARGET[name], version];
  }));

  assert.ok(header.length >= 2, `${GUIDE}: the "Minimum versions" table has no version column`);
  assert.deepEqual(
    latest,
    expected,
    `${GUIDE}: the "${header.at(-1)}" column must match BROWSERS_LIST in browser-targets.js`,
  );
});

test('the migration guide to the last column release names every floor version in a browser section', () => {
  const release = /^Handsontable (\d+\.\d+)$/.exec(header.at(-1))?.[1];

  assert.ok(release, `${GUIDE}: title the last column "Handsontable <major>.<minor>", not "${header.at(-1)}"`);

  const folder = readdirSync(path.join(ROOT, MIGRATION_GUIDES)).find(name => name.endsWith(`-to-${release}`));

  assert.ok(folder, `${MIGRATION_GUIDES} has no migration guide to ${release}`);

  const guide = readFileSync(path.join(ROOT, MIGRATION_GUIDES, folder, `${folder}.md`), 'utf8');
  const section = guide.split(/^## /m).find(part => /browser/i.test(part.split('\n')[0]));

  assert.ok(section, `${folder}.md has no "## <N>. ..." section about browsers`);

  const named = version => new RegExp(`(^|[^\\d.])${version.replace('.', '\\.')}($|[^\\d])`).test(section);
  const missing = targets.filter(({ version }) => !named(version)).map(({ name, version }) => `${name} ${version}`);

  assert.deepEqual(missing, [], `${folder}.md: the browser section must name the ${release} minimum versions`);
});
