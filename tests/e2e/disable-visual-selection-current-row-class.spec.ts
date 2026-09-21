import { test, expect } from '../fixtures/test';
import { DisableVisualSelectionCurrentRowClassPage } from '../fixtures/pages/DisableVisualSelectionCurrentRowClassPage';

const { HEADER, FALSE, TRUE, CURRENT, AREA, ARRAY, CURRENT_ROW_CLASS, CURRENT_COL_CLASS } =
  DisableVisualSelectionCurrentRowClassPage;

/**
 * DEV-228 (dev-handsontable#273). `disableVisualSelection: 'header'` is documented to hide only
 * header selection, leaving single-cell and range selection - and with them the current-row and
 * current-column indicators (`currentRowClassName` / `currentColClassName`) - shown. It used to
 * strip those classes off the body cells as well, because the row/column highlight was committed
 * under the same `HEADER_TYPE` gate as the header highlight.
 *
 * Every grid selects the same body cell (2, 2). The fix has two halves and the spec pins both: the
 * current-row/column classes come back on the body cells under 'header', AND the header-selection
 * highlight (`ht__highlight`) stays off - the half 'header' is meant to disable.
 */
test.describe('disableVisualSelection vs currentRow/ColClassName (DEV-228)', () => {
  let grid: DisableVisualSelectionCurrentRowClassPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DisableVisualSelectionCurrentRowClassPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe("disableVisualSelection: 'header'", () => {
    test('keeps currentRowClassName on the selected row and currentColClassName on the column', async () => {
      await grid.selectCell(HEADER, 2, 2);

      // The selected cell carries both; a cell only on the row carries the row class; a cell only
      // on the column carries the column class.
      expect(await grid.cellClasses(HEADER, 2, 2)).toEqual(
        expect.arrayContaining([CURRENT_ROW_CLASS, CURRENT_COL_CLASS])
      );
      expect(await grid.cellClasses(HEADER, 2, 0)).toContain(CURRENT_ROW_CLASS);
      expect(await grid.cellClasses(HEADER, 0, 2)).toContain(CURRENT_COL_CLASS);

      // And the classes reach the whole rendered row and column, not just the focus cell.
      expect(await grid.cellCount(HEADER, CURRENT_ROW_CLASS)).toBeGreaterThan(1);
      expect(await grid.cellCount(HEADER, CURRENT_COL_CLASS)).toBeGreaterThan(1);
    });

    test('marks the row and column HEADER cells with the classes but not the header-selection highlight', async () => {
      await grid.selectCell(HEADER, 2, 2);

      // The row/column highlight spans the header too, so the current-row/column classes reach the
      // matching header cells - this is the one genuinely new-on-header behavior the fix adds, and
      // the JSDoc promises it.
      expect(await grid.headerCellCount(HEADER, CURRENT_ROW_CLASS)).toBeGreaterThan(0);
      expect(await grid.headerCellCount(HEADER, CURRENT_COL_CLASS)).toBeGreaterThan(0);

      // But the header SELECTION highlight (`ht__highlight`, `currentHeaderClassName`) is the half
      // 'header' disables, and it stays gated on HEADER_TYPE - so it must remain off. This is what
      // separates "the current-row indicator reaches the header" from "header selection is back".
      expect(await grid.headerHighlightCount(HEADER)).toBe(0);
    });
  });

  test.describe('the other values are unchanged', () => {
    test('false shows the classes and the header highlight', async () => {
      await grid.selectCell(FALSE, 2, 2);

      expect(await grid.cellClasses(FALSE, 2, 0)).toContain(CURRENT_ROW_CLASS);
      expect(await grid.cellClasses(FALSE, 0, 2)).toContain(CURRENT_COL_CLASS);
      expect(await grid.headerHighlightCount(FALSE)).toBeGreaterThan(0);
    });

    test('true hides the classes', async () => {
      await grid.selectCell(TRUE, 2, 2);

      expect(await grid.cellCount(TRUE, CURRENT_ROW_CLASS)).toBe(0);
      expect(await grid.cellCount(TRUE, CURRENT_COL_CLASS)).toBe(0);
    });

    test('current keeps the classes (only the focus cell highlight is suppressed)', async () => {
      await grid.selectCell(CURRENT, 2, 2);

      expect(await grid.cellClasses(CURRENT, 2, 0)).toContain(CURRENT_ROW_CLASS);
      expect(await grid.cellClasses(CURRENT, 0, 2)).toContain(CURRENT_COL_CLASS);
    });

    test('area keeps the classes', async () => {
      await grid.selectCell(AREA, 2, 2);

      expect(await grid.cellClasses(AREA, 2, 0)).toContain(CURRENT_ROW_CLASS);
      expect(await grid.cellClasses(AREA, 0, 2)).toContain(CURRENT_COL_CLASS);
    });

    test("the array form ['area', 'header'] keeps the classes (its blast radius includes 'header')", async () => {
      // An array holding 'header' but not all three must behave like 'header' for the row/column
      // indicator: still shown. Only `true` / all-three hides it.
      await grid.selectCell(ARRAY, 2, 2);

      expect(await grid.cellClasses(ARRAY, 2, 0)).toContain(CURRENT_ROW_CLASS);
      expect(await grid.cellClasses(ARRAY, 0, 2)).toContain(CURRENT_COL_CLASS);
      expect(await grid.headerHighlightCount(ARRAY)).toBe(0);
    });
  });
});
