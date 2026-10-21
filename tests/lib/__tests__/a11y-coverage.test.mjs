import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { A11Y_PAGES } from '../../a11y/pages.mjs';
import { A11Y_GAP_LIMIT, EDITOR_COVERAGE, PLUGIN_COVERAGE } from '../../a11y/coverage.mjs';

/**
 * Every plugin and editor folder says how the axe scan covers it (`tests/a11y/coverage.mjs`), so a
 * new UI surface cannot ship unscanned by accident: the folder fails this test until its entry
 * names the pages that scan it, says why it draws nothing to scan, or is counted as a known gap.
 * The folders are read from disk, not from a list, so a new one is caught the day it lands.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PAGE_IDS = new Set(A11Y_PAGES.map(page => page.id));
const KINDS = ['pages', 'none', 'gap'];
// A reason says what the code draws or why it draws nothing; a word or two says neither.
const MIN_REASON = 20;

/**
 * The folders under a source directory that hold a plugin or an editor.
 *
 * @param {string} relative The directory, relative to the repository root.
 * @param {string[]} ignored Folders that hold no plugin or editor of their own.
 * @returns {string[]} The folder names, sorted.
 */
function folders(relative, ignored) {
  const dir = path.join(REPO_ROOT, relative);

  return readdirSync(dir)
    .filter(name => !ignored.includes(name) && statSync(path.join(dir, name)).isDirectory())
    .sort();
}

const SOURCES = [
  { label: 'plugin', dir: 'handsontable/src/plugins', ignored: ['__tests__', 'base'], coverage: PLUGIN_COVERAGE },
  { label: 'editor', dir: 'handsontable/src/editors', ignored: ['__tests__', 'baseEditor', 'utils'], coverage: EDITOR_COVERAGE },
];

for (const { label, dir, ignored, coverage } of SOURCES) {
  test(`every ${label} folder has a coverage entry, and every entry has a folder`, () => {
    const names = folders(dir, ignored);

    // A positive control: a misread directory would make both checks below pass on nothing.
    assert.ok(names.length > 10, `expected the ${label} folders under ${dir}, found ${names.length}`);
    assert.deepEqual(names.filter(name => !(name in coverage)), [],
      `each ${label} needs an entry in tests/a11y/coverage.mjs: the pages that scan it, why it draws nothing, or a gap`);
    assert.deepEqual(Object.keys(coverage).filter(name => !names.includes(name)), [],
      `an entry in tests/a11y/coverage.mjs names a ${label} folder that does not exist under ${dir}`);
  });

  test(`every ${label} entry is one kind, with scanned pages or a reason`, () => {
    for (const [name, entry] of Object.entries(coverage)) {
      const kinds = Object.keys(entry);

      assert.equal(kinds.length, 1, `${name}: one of ${KINDS.join(', ')}, got ${kinds.join(', ')}`);
      assert.ok(KINDS.includes(kinds[0]), `${name}: unknown kind "${kinds[0]}"`);

      if ('pages' in entry) {
        assert.ok(Array.isArray(entry.pages) && entry.pages.length > 0, `${name}: "pages" lists at least one page`);
        for (const id of entry.pages) {
          assert.ok(PAGE_IDS.has(id), `${name}: page "${id}" is not in tests/a11y/pages.mjs`);
        }
      } else {
        const reason = entry.none ?? entry.gap;

        assert.ok(typeof reason === 'string' && reason.trim().length >= MIN_REASON,
          `${name}: say what it draws or why it draws nothing, in ${MIN_REASON} characters or more`);
      }
    }
  });
}

test('the gap count is the limit: a new gap fails, and a closed gap lowers the limit', () => {
  const gaps = [...Object.entries(PLUGIN_COVERAGE), ...Object.entries(EDITOR_COVERAGE)]
    .filter(([, entry]) => 'gap' in entry)
    .map(([name]) => name);

  assert.ok(gaps.length <= A11Y_GAP_LIMIT,
    `${gaps.length} gaps against a limit of ${A11Y_GAP_LIMIT}: scan the new surface (add a page to tests/a11y/pages.mjs) instead of adding a gap`);
  assert.equal(gaps.length, A11Y_GAP_LIMIT,
    `${gaps.length} gaps against a limit of ${A11Y_GAP_LIMIT}: lower A11Y_GAP_LIMIT in tests/a11y/coverage.mjs to match`);
});
