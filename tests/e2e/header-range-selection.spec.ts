import { test, expect } from '../fixtures/test';
import { GridLayoutsPage, type GridLayout } from '../fixtures/pages/GridLayoutsPage';

/**
 * A header click followed by a Shift+click on another header selects every column (or row) between
 * the two, highlights exactly those headers, and keeps the focus where the range started.
 *
 * The cross-browser visual suite photographed these ranges on five demo routes
 * (`visual-tests/tests/cross-browser/selection.spec.ts`). The Jasmine selection suites assert header
 * ranges with simulated events, Shift+click ranges over nested headers included, but not with real
 * pointer events, not with `navigableHeaders`, and not on the hidden-column, frozen, right-to-left and
 * nested-rows shapes; on those the screenshots were the only record until DEV-3257 of which range a
 * click selected, and a range one column off was the golden for as long as the helper that aimed the
 * clicks miscounted nested header cells. Each case here rebuilds one route's
 * shape in `fixtures/demo/grid-layouts.html` and clicks the same headers the visual spec does — the
 * third and the sixth RENDERED column, so the visual indexes skip a hidden column — and asserts the
 * selection the grid reports and the headers it draws as selected.
 *
 * The shapes each change the answer in a different way: hidden columns move the visual indexes the
 * range is reported in and the column focus lands on; a right-to-left grid reverses where the second
 * header sits; a nested header highlights a group cell only when the range covers its whole span;
 * hidden rows inside a row range stay part of it without being drawn; and `navigableHeaders` (on the
 * nested-headers and nested-rows shapes, as on their demos) puts the focus on the header rather than
 * on the first cell under it.
 */

type HeaderRangeCase = {
  layout: GridLayout,
  route: string,
  columns: [number, number],
  // The group cells, in the top header row, that the column range covers completely. `null` on a
  // grid with one header row.
  groups: number[] | null,
  // Where the column range leaves the focus. `null` where the grid does not do it yet; the parked test
  // at the end of the file tracks that case.
  columnFocus: { row: number, col: number } | null,
  rows: [number, number],
  // The rows the grid draws inside the row range: the range minus its hidden rows.
  drawnRows: number[],
  rowFocus: { row: number, col: number },
};

const CASES: HeaderRangeCase[] = [
  {
    layout: 'frozen-hidden',
    route: '/cell-types-demo',
    // Columns 0 and 2 are hidden, so the third and sixth rendered columns are 4 and 7.
    columns: [4, 7],
    groups: null,
    columnFocus: { row: 0, col: 4 },
    rows: [2, 5],
    drawnRows: [2, 3, 4, 5],
    // Column 0 is hidden, so a row range focuses the first column the grid renders.
    rowFocus: { row: 2, col: 1 },
  },
  {
    layout: 'rtl-nested-headers',
    route: '/arabic-rtl-demo',
    columns: [2, 5],
    // "Extra" spans column 5 alone, so the range covers it; "Details" spans 1-4 and is cut.
    groups: [5],
    columnFocus: { row: 0, col: 2 },
    rows: [2, 5],
    drawnRows: [2, 3, 4, 5],
    rowFocus: { row: 2, col: 0 },
  },
  {
    layout: 'merged-sorted',
    route: '/merged-cells-demo',
    columns: [2, 5],
    groups: null,
    columnFocus: { row: 0, col: 2 },
    rows: [2, 5],
    drawnRows: [2, 3, 4, 5],
    rowFocus: { row: 2, col: 0 },
  },
  {
    layout: 'nested-headers',
    route: '/nested-headers-demo',
    columns: [2, 5],
    // "Product" spans 0-3 and "Category" 4-6: the range cuts both.
    groups: [],
    // navigableHeaders: true puts the focus on a header, and it should stay on the one the range
    // started from, (-1, 2). It moves to the Shift-clicked one instead: the parked test below.
    columnFocus: null,
    rows: [2, 5],
    drawnRows: [2, 3, 4, 5],
    rowFocus: { row: 2, col: -1 },
  },
  {
    layout: 'nested-rows',
    route: '/nested-rows-demo',
    // Column 1 is hidden, so the third and sixth rendered columns are 3 and 6.
    columns: [3, 6],
    groups: null,
    // navigableHeaders: true over a single header row, so the focus stays on the header the range
    // started from: the flat-header counterpart of the parked nested-headers test below.
    columnFocus: { row: -1, col: 3 },
    // Rows 3, 4 and 5 are hidden, so the third and sixth rendered rows are 2 and 8.
    rows: [2, 8],
    drawnRows: [2, 6, 7, 8],
    rowFocus: { row: 2, col: -1 },
  },
];

/**
 * Every integer from `from` to `to`, both included.
 *
 * @param {number} from The first index.
 * @param {number} to The last index.
 * @returns {number[]}
 */
function span(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

test.describe('a header click and a Shift+click select the range between them', () => {
  let grid: GridLayoutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridLayoutsPage(page, theme, bundle);
  });

  for (const testCase of CASES) {
    test(`selects the columns between two column headers on the ${testCase.route} shape`, async() => {
      const [first, last] = testCase.columns;

      await grid.goto(testCase.layout);

      const { rows } = await grid.size();
      const levels = await grid.headerLevels();

      await grid.clickColumnHeader(first);
      await grid.clickColumnHeader(last, ['Shift']);

      // Row -1 is the header: a column range starts at the header row and runs to the last row.
      expect(await grid.selected()).toEqual([[-1, first, rows - 1, last]]);
      expect(await grid.activeColumnHeaders(levels - 1)).toEqual(span(first, last));

      if (testCase.groups !== null) {
        expect(await grid.activeColumnHeaders(0)).toEqual(testCase.groups);
      }

      if (testCase.columnFocus !== null) {
        expect(await grid.focus()).toEqual(testCase.columnFocus);
      }
    });

    test(`selects the rows between two row headers on the ${testCase.route} shape`, async() => {
      const [first, last] = testCase.rows;

      await grid.goto(testCase.layout);

      const { columns } = await grid.size();

      await grid.clickRowHeader(first);
      await grid.clickRowHeader(last, ['Shift']);

      expect(await grid.selected()).toEqual([[first, -1, last, columns - 1]]);
      expect(await grid.activeRowHeaders()).toEqual(testCase.drawnRows);
      expect(await grid.focus()).toEqual(testCase.rowFocus);
    });
  }

  // On a grid with nested headers and navigableHeaders, the Shift+click is handled by the plugin,
  // which starts a new column selection instead of extending the current one, so the focus moves to
  // the Shift-clicked header. The nested-rows shape has navigableHeaders over a single header row and
  // keeps the focus on the header the range started from, and so do this shape's row headers.
  // eslint-disable-next-line no-restricted-syntax -- DEV-3261: a Shift+click on a nested column header moves the focus to the clicked header
  test.fixme('keeps the focus on the first column header of a range on the /nested-headers-demo shape', async() => {
    await grid.goto('nested-headers');

    await grid.clickColumnHeader(2);
    await grid.clickColumnHeader(5, ['Shift']);

    expect(await grid.focus()).toEqual({ row: -1, col: 2 });
  });
});
