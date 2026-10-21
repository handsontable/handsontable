import { test, expect } from '../fixtures/test';
import { DisableVisualSelectionCurrentRowClassPage } from '../fixtures/pages/DisableVisualSelectionCurrentRowClassPage';

const { HEADER, FALSE, TRUE, CURRENT, AREA, ARRAY, CURRENT_HEADER, ALL, CURRENT_ROW_CLASS, CURRENT_COL_CLASS } =
  DisableVisualSelectionCurrentRowClassPage;

const hasRowClass = new RegExp(`\\b${CURRENT_ROW_CLASS}\\b`);
const hasColClass = new RegExp(`\\b${CURRENT_COL_CLASS}\\b`);

/**
 * DEV-228 (dev-handsontable#273). `disableVisualSelection: 'header'` is documented to hide only
 * header selection, leaving single-cell and range selection - and with them the current-row and
 * current-column indicators (`currentRowClassName` / `currentColClassName`) - shown. It used to
 * strip those classes off the body cells as well, because the row/column highlight was committed
 * under the same `HEADER_TYPE` gate as the header highlight.
 *
 * Every grid selects the same body cell (2, 2). The fix has two halves and the spec pins both: the
 * current-row/column classes come back on the body cells (and the row/column header cells) under
 * 'header', AND the header-selection highlight (`ht__highlight`) stays off - the half 'header' is
 * meant to disable.
 */
test.describe('disableVisualSelection vs currentRow/ColClassName (DEV-228)', () => {
  let grid: DisableVisualSelectionCurrentRowClassPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DisableVisualSelectionCurrentRowClassPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe("disableVisualSelection: 'header'", () => {
    test('keeps currentRowClassName across the selected row and currentColClassName down the column', async () => {
      await grid.selectCell(HEADER, 2, 2);

      // The selected cell carries both; the whole row carries the row class and the whole column
      // the column class (asserted at both ends, so it is the span, not just the focus cell).
      await expect(grid.cell(HEADER, 2, 2)).toHaveClass(hasRowClass);
      await expect(grid.cell(HEADER, 2, 2)).toHaveClass(hasColClass);
      await expect(grid.cell(HEADER, 2, 0)).toHaveClass(hasRowClass);
      await expect(grid.cell(HEADER, 2, 4)).toHaveClass(hasRowClass);
      await expect(grid.cell(HEADER, 0, 2)).toHaveClass(hasColClass);
      await expect(grid.cell(HEADER, 4, 2)).toHaveClass(hasColClass);
    });

    test('marks the row and column HEADER cells with the classes but not the header-selection highlight', async () => {
      await grid.selectCell(HEADER, 2, 2);

      // The row/column highlight spans the header too, so the current-row/column classes reach the
      // matching header cells - the one genuinely new-on-header behavior the fix adds, promised by
      // the JSDoc.
      await expect(grid.headerCells(HEADER, CURRENT_ROW_CLASS)).not.toHaveCount(0);
      await expect(grid.headerCells(HEADER, CURRENT_COL_CLASS)).not.toHaveCount(0);

      // But the header SELECTION highlight (`ht__highlight`, `currentHeaderClassName`) is the half
      // 'header' disables, and it stays gated on HEADER_TYPE - so it must remain off. This is what
      // separates "the current-row indicator reaches the header" from "header selection is back".
      await expect(grid.headerHighlight(HEADER)).toHaveCount(0);
    });
  });

  test.describe('the other values behave as before', () => {
    test('false shows the classes on body AND header cells, plus the header highlight', async () => {
      await grid.selectCell(FALSE, 2, 2);

      await expect(grid.cell(FALSE, 2, 0)).toHaveClass(hasRowClass);
      await expect(grid.cell(FALSE, 0, 2)).toHaveClass(hasColClass);
      // The control for the 'header' header-cell assertion above: the classes reach the header with
      // `false` too, so "as they do with `false`" is proven, not assumed.
      await expect(grid.headerCells(FALSE, CURRENT_ROW_CLASS)).not.toHaveCount(0);
      await expect(grid.headerCells(FALSE, CURRENT_COL_CLASS)).not.toHaveCount(0);
      await expect(grid.headerHighlight(FALSE)).not.toHaveCount(0);
    });

    test('true hides the classes (boolean branch)', async () => {
      await grid.selectCell(TRUE, 2, 2);

      await expect(grid.bodyCells(TRUE, CURRENT_ROW_CLASS)).toHaveCount(0);
      await expect(grid.bodyCells(TRUE, CURRENT_COL_CLASS)).toHaveCount(0);
    });

    test("['current', 'area', 'header'] hides the classes (array branch - the case the new gate introduces)", async () => {
      // The gate hides the indicator only when all three `isEnabledFor` calls are false. `true`
      // reaches that through the boolean short-circuit; this array reaches it through the
      // `Array.isArray(...) && !includes(type)` path. Different branch, so it needs its own case -
      // and it is the one value the three-way gate decides differently from a bare ROW_TYPE check.
      await grid.selectCell(ALL, 2, 2);

      await expect(grid.bodyCells(ALL, CURRENT_ROW_CLASS)).toHaveCount(0);
      await expect(grid.bodyCells(ALL, CURRENT_COL_CLASS)).toHaveCount(0);
    });

    test('current keeps the classes (only the focus cell highlight is suppressed)', async () => {
      await grid.selectCell(CURRENT, 2, 2);

      await expect(grid.cell(CURRENT, 2, 0)).toHaveClass(hasRowClass);
      await expect(grid.cell(CURRENT, 0, 2)).toHaveClass(hasColClass);
    });

    test('area keeps the classes', async () => {
      await grid.selectCell(AREA, 2, 2);

      await expect(grid.cell(AREA, 2, 0)).toHaveClass(hasRowClass);
      await expect(grid.cell(AREA, 0, 2)).toHaveClass(hasColClass);
    });

    test("['area', 'header'] keeps the classes (its blast radius includes 'header')", async () => {
      await grid.selectCell(ARRAY, 2, 2);

      await expect(grid.cell(ARRAY, 2, 0)).toHaveClass(hasRowClass);
      await expect(grid.cell(ARRAY, 0, 2)).toHaveClass(hasColClass);
      await expect(grid.headerHighlight(ARRAY)).toHaveCount(0);
    });

    test("['current', 'header'] keeps the classes (the other changed-behavior value)", async () => {
      await grid.selectCell(CURRENT_HEADER, 2, 2);

      await expect(grid.cell(CURRENT_HEADER, 2, 0)).toHaveClass(hasRowClass);
      await expect(grid.cell(CURRENT_HEADER, 0, 2)).toHaveClass(hasColClass);
      await expect(grid.headerHighlight(CURRENT_HEADER)).toHaveCount(0);
    });
  });
});
