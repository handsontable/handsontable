import { test, expect, THEMES_TAG } from '../fixtures/test';
import { AutoRowSizeColumnSweepPage } from '../fixtures/pages/AutoRowSizeColumnSweepPage';

/**
 * AutoColumnSize measures the columns past its synchronous part in idle tasks, and AutoRowSize
 * measures every row before that, against the default width those columns still have. A long text in
 * such a column wraps there, so the row was stored as tall as the wrapped text and kept that height
 * once the column widened: nothing measured the row again. In view, the row header and the row stayed
 * taller than their text; below the fold, no render measured the row at all.
 *
 * The fixture's grid has 130 columns, so columns 103 and up are measured in idle tasks. The long text
 * sits in column 120 (column 125 after `loadData()`), in row 5, on screen, and in row 250, below it.
 * A reference grid with the same data measures every column before `init` returns, and its row heights
 * are what the grid under test must reach. Nothing here calls `render()`: the grid owes the measurement
 * itself.
 */
test.describe('AutoRowSize after the AutoColumnSize idle sweep', { tag: THEMES_TAG }, () => {
  const ROW_IN_VIEW = 5;
  const ROW_BELOW_FOLD = 250;
  // The default column width the long text wraps in before its column is measured.
  const DEFAULT_COLUMN_WIDTH = 50;

  let grid: AutoRowSizeColumnSweepPage;

  /**
   * Waits for the grid under test to store the row height the reference grid stores for the row. The
   * reference must be a measured height, or two unmeasured rows would compare equal.
   *
   * @param {number} row Visual row index.
   */
  async function expectRowHeightOfReference(row: number): Promise<void> {
    const { reference } = await grid.rowHeights(row);

    expect(reference).toEqual(expect.any(Number));
    await expect.poll(async() => (await grid.rowHeights(row)).grid).toBe(reference);
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoRowSizeColumnSweepPage(page, theme, bundle);
    await grid.goto();
    await grid.waitForSweepsToEnd();
  });

  test('measures a row below the fold again once the columns are measured', async() => {
    // The positive control: the column the row wraps in did widen in an idle task.
    expect(await grid.columnWidth(120)).toBeGreaterThan(DEFAULT_COLUMN_WIDTH * 2);

    await expectRowHeightOfReference(ROW_BELOW_FOLD);
  });

  test('draws a row in view at its measured height once the columns are measured', async() => {
    const { reference } = await grid.drawnRowHeaderHeights(ROW_IN_VIEW);

    await expect.poll(async() => (await grid.drawnRowHeaderHeights(ROW_IN_VIEW)).grid).toBe(reference);
    await expectRowHeightOfReference(ROW_IN_VIEW);
  });

  test('measures a row below the fold again after loadData() once the columns are measured', async() => {
    // Column 125 held short values, so it is narrow when AutoRowSize measures the new rows.
    const widthBefore = await grid.columnWidth(125);

    await grid.loadLongTextInAnotherColumn();
    await grid.waitForSweepsToEnd();

    expect(await grid.columnWidth(125)).toBeGreaterThan(widthBefore);
    await expectRowHeightOfReference(ROW_BELOW_FOLD);
  });
});
