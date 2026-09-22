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

  // A method call, so the dot matters: the refusal message names `getByRole` as the alternative to
  // reach for, and that mention is not a role lookup.
  assert.doesNotMatch(resolver, /\.getByRole\(/,
    'headerCellAt() must resolve the index from the scoped selectors it is given, not from a role lookup');
});

test('a source index is mapped through the rendered window before it indexes the scrollable overlay', () => {
  // The scrollable overlays hold the RENDERED window, not the whole grid, so `.nth(sourceIndex)` on
  // them is only right while the grid is scrolled to its start. Measured on `large-dataset-demo`: at
  // rest the first leaf header is column 0, scrolled 1200px it is column 22 — so `.nth(0)` there would
  // have clicked column 22 and the highlight assertion would have passed on it. Only the frozen
  // prefix is addressed by the raw index, because the corner overlay renders exactly that prefix.
  const source = read('visual-tests/src/page-helpers.ts');
  const resolver = bodyOf(source, 'headerCellAt');
  const finder = bodyOf(source, 'positionInRenderedWindow');

  assert.match(resolver, /\.nth\(position\)/,
    'headerCellAt() must index the scrollable overlay by the position it resolved, not by the source '
    + 'index — the overlay holds the rendered window');
  assert.doesNotMatch(resolver.slice(resolver.indexOf('positionInRenderedWindow')), /locator\(cells\)\.nth\(index\)/,
    'the source index must not reach the scrollable overlay unmapped');
  assert.match(resolver, /frozen\.nth\(index\)/,
    'the frozen prefix IS addressed by the raw index; the corner overlay renders exactly that prefix');

  // The mapping has to come from the cells, because the headers cannot answer it: a header's
  // `aria-colindex` is window-relative (`visibleColumnIndex + 1`) while a data cell's is absolute.
  assert.match(finder, /aria-colindex/, 'the column mapping must read the cells\' absolute aria-colindex');
  assert.match(finder, /aria-rowindex/, 'the row mapping must read the rows\' absolute aria-rowindex');
  assert.match(finder, /\.ht_master tbody tr/,
    'the mapping must read the master overlay, which carries the same window as the header overlays');
  assert.doesNotMatch(finder, /thead tr:last-child/,
    'the mapping must not be read off the header row — a header\'s aria-colindex restarts at the '
    + 'window, which is the very thing being corrected for');
});

test('a grid with no data rows refuses rather than treating the index as its own position', () => {
  // The window is read from the cells, so a grid with `colHeaders` and no data carries nothing to read
  // it from — `empty-data-state-demo` renders its headers over zero body rows, and headers virtualize
  // there like anywhere else. Returning the wanted index as its own position would put the guess back
  // in, and past the rendered count it degrades into a Playwright timeout with nothing to read, which
  // is the opposite of what the refusal exists for. Flagged in review; the other pins constrain the
  // refusal shape but not this early return.
  const source = read('visual-tests/src/page-helpers.ts');
  const finder = bodyOf(source, 'positionInRenderedWindow');
  const resolver = bodyOf(source, 'headerCellAt');

  assert.match(finder, /rows\.length === 0/, 'positionInRenderedWindow() must still handle a grid with no rows');
  assert.doesNotMatch(finder, /position:\s*wanted/,
    'the no-rows branch must not return the wanted index as its own position — there is no absolute '
    + 'index in the DOM to justify it');

  const emptyBranch = finder.slice(finder.indexOf('rows.length === 0'), finder.indexOf('if (which ==='));

  assert.match(emptyBranch, /position:\s*-1/, 'the no-rows branch must refuse');
  assert.match(emptyBranch, /rendered:\s*\[\]/,
    'the no-rows branch must return an empty window, which is how the caller tells "cannot tell" apart '
    + 'from "scrolled out of view"');

  // And the two refusals must read differently, or the message sends the reader after a scroll
  // position that was never the problem.
  assert.match(resolver, /rendered\.length === 0/,
    'headerCellAt() must distinguish "no data rows to read the window from" from "not rendered"');
  assert.match(resolver, /no data rows/, 'the no-data refusal must say so in words');
});

test('a target outside the rendered window is refused, not approximated', () => {
  // `.nth()` of a missing element is a locator that never resolves, so the silent failure mode here is
  // a timeout with no explanation. Refusing names the axis, the index and the window that is rendered.
  const resolver = bodyOf(read('visual-tests/src/page-helpers.ts'), 'headerCellAt');

  assert.match(resolver, /position < 0/, 'headerCellAt() must detect a target that is not rendered');
  assert.match(resolver, /throw new Error\(/,
    'headerCellAt() must refuse an unrendered target rather than clicking the nearest header');
  assert.match(resolver, /rendered\[0\]/,
    'the refusal must name the window that IS rendered, or it cannot be acted on');
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
