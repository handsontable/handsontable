import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// `selectColumnHeaderByIndex()` used to count every header cell the grid draws rather than counting
// columns, so on a grid with a nested header it clicked a group label or a spacer, and the group row's
// cell count moved with the rendered window — the same index picked a different column in two runs of
// the same build. That is what flipped `selection-arabic-rtl-demo-2.png` on #13568 and
// `selection-nested-headers-demo-{2,3}.png` on #13587, one column at a time, on unrelated pull
// requests.
//
// The repair is a handful of selectors, which is exactly the kind of code a later simplification puts
// back. These tests pin the properties that make it correct: the index is resolved inside a single
// header row, a frozen header is clicked in the overlay that covers it, and the click is followed by an
// assertion so the capture after it cannot photograph the grid mid-update. The last pins the engine
// fact the first one leans on.
const root = path.join(import.meta.dirname, '../../..');
const read = rel => readFileSync(path.join(root, rel), 'utf8');

/**
 * Extract one function's body from the page helpers, exported or not.
 *
 * @param {string} source The `page-helpers.ts` contents.
 * @param {string} name The exported function's name.
 * @returns {string} The body, from the signature to the closing brace at column 0.
 */
function bodyOf(source, name) {
  const start = source.indexOf(`async function ${name}(`);

  assert.notEqual(start, -1, `${name}() is gone from visual-tests/src/page-helpers.ts`);

  const end = source.indexOf('\n}', start);

  assert.notEqual(end, -1, `${name}() has no closing brace at column 0`);

  return source.slice(start, end);
}

test('the index-based header helpers resolve the index inside ONE header row', () => {
  const source = read('visual-tests/src/page-helpers.ts');
  const column = bodyOf(source, 'selectColumnHeaderByIndex');
  const row = bodyOf(source, 'selectRowHeaderByIndex');

  // The failing shape, spelled out so the message names it: an unscoped role lookup spans both rows of
  // a nested header and every overlay, and `.nth()` over that is not a column index.
  assert.doesNotMatch(column, /getByRole\(\s*'columnheader'\s*\)/,
    'selectColumnHeaderByIndex() must not index an unscoped getByRole(\'columnheader\') — that list '
    + 'includes the nested-header group row, so nth(2) is not column 2 and its position moves with the '
    + 'rendered window');
  assert.doesNotMatch(row, /getByRole\(\s*'rowheader'\s*\)/,
    'selectRowHeaderByIndex() must not index an unscoped getByRole(\'rowheader\')');

  // `tr:last-child` is what makes the list 1:1 with columns: one cell per rendered column, whatever
  // nesting sits above it.
  assert.match(source, /const COLUMN_HEADER_CELLS = '[^']*thead tr:last-child[^']*'/,
    'COLUMN_HEADER_CELLS must stay scoped to the LAST header row; any earlier row is a group row');
  assert.match(column, /COLUMN_HEADER_CELLS/, 'selectColumnHeaderByIndex() must use COLUMN_HEADER_CELLS');
  assert.match(row, /ROW_HEADER_CELLS/, 'selectRowHeaderByIndex() must use ROW_HEADER_CELLS');

  // The indexing itself lives in the shared resolver, so the ban has to reach there too.
  const resolver = bodyOf(source, 'headerCellAt');

  assert.doesNotMatch(resolver, /getByRole\(/,
    'headerCellAt() must resolve the index from the scoped selectors it is given, not from a role lookup');
  assert.match(resolver, /\.nth\(index\)/, 'headerCellAt() no longer indexes by the index it was given');
});

test('a frozen header is clicked in the overlay that is painted on top of it', () => {
  // A frozen column's header is drawn twice at the same coordinates, and the copy in the top overlay
  // is the one underneath: Playwright's hit-target check refuses it, so the call times out instead of
  // selecting anything. Measured on `cell-types-demo` for columns and `custom-borders-demo` for
  // `fixedRowsTop`. The resolver prefers the corner overlay for the frozen prefix; without that
  // preference `selectColumnHeaderByIndex(0)` cannot work on any grid with a frozen column.
  const source = read('visual-tests/src/page-helpers.ts');
  const resolver = bodyOf(source, 'headerCellAt');

  assert.match(source, /const FROZEN_COLUMN_HEADER_CELLS =\s*'\.ht_clone_top_inline_start_corner[^']*'/,
    'FROZEN_COLUMN_HEADER_CELLS must read the corner overlay, which is the copy a pointer reaches');
  assert.match(source, /const FROZEN_ROW_HEADER_CELLS = '\.ht_clone_top_inline_start_corner[^']*'/,
    'FROZEN_ROW_HEADER_CELLS must read the corner overlay');
  assert.match(resolver, /index < frozenCount/,
    'headerCellAt() must send the frozen prefix to the corner overlay; the frozen headers are the '
    + 'first indices in both axes');

  ['selectColumnHeaderByIndex', 'selectRowHeaderByIndex'].forEach((name) => {
    assert.match(bodyOf(source, name), /FROZEN_(COLUMN|ROW)_HEADER_CELLS/,
      `${name}() must pass its frozen-prefix selector to headerCellAt()`);
  });
});

test('both helpers assert the header is highlighted before they return', () => {
  const source = read('visual-tests/src/page-helpers.ts');

  ['selectColumnHeaderByIndex', 'selectRowHeaderByIndex'].forEach((name) => {
    const body = bodyOf(source, name);
    const clickAt = body.indexOf('.click(');
    const assertAt = body.search(/await expect\([^)]*\)\.toHaveClass\(/);

    assert.notEqual(clickAt, -1, `${name}() no longer clicks anything`);
    assert.notEqual(assertAt, -1,
      `${name}() must assert the selection landed before returning — a click resolves when the event is `
      + 'dispatched, and the screenshot on the next line of the spec would photograph the frame before '
      + 'the grid repaints');
    assert.ok(assertAt > clickAt, `${name}() asserts before it clicks, which proves nothing`);

    // Anchored, or it is not discriminating: the header next to an active one carries
    // `ht__active_highlight-prev`, so an unanchored pattern passes for a click that landed one over.
    assert.match(body, /toHaveClass\(\/\(\^\|\\s\)ht__\(active_\)\?highlight\(\\s\|\$\)\//,
      `${name}() must anchor the highlight pattern; ht__active_highlight-prev on the neighbouring `
      + 'header would otherwise satisfy it');
  });
});

test('the corner cell is still excluded from the column-header role', () => {
  // COLUMN_HEADER_CELLS filters on `role="columnheader"` so that the row-header corner — which sits in
  // the same header row, one per `rowHeadersCount` — does not take index 0 and shift every column by
  // one. The engine gives that corner `gridcell button` instead. Mirrored by hand here because a
  // Playwright helper cannot import the engine's constants (the precedent is scrollbar-proximity.test.mjs).
  const a11y = read('handsontable/src/helpers/a11y.ts');
  const corner = a11y.match(/export const A11Y_GRIDCELL_BUTTON = \(\): \[string, string\] => \['role', '([^']+)'\];/);
  const header = a11y.match(/export const A11Y_COLUMNHEADER = \(\): \[string, string\] => \['role', '([^']+)'\];/);

  assert.ok(corner, 'A11Y_GRIDCELL_BUTTON is no longer a plain role literal in handsontable/src/helpers/a11y.ts');
  assert.ok(header, 'A11Y_COLUMNHEADER is no longer a plain role literal in handsontable/src/helpers/a11y.ts');
  assert.notEqual(corner[1], header[1],
    'the grid corner now carries the same role as a column header, so COLUMN_HEADER_CELLS matches it too '
    + 'and every selectColumnHeaderByIndex() call is off by the row-header count — re-scope the selector');

  const source = read('visual-tests/src/page-helpers.ts');

  assert.match(source, new RegExp(`const COLUMN_HEADER_CELLS = '[^']*role="${header[1]}"[^']*'`),
    'COLUMN_HEADER_CELLS must filter on the engine\'s column-header role');
});
