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
  const ONE_LINE_ROW = 3;
  const ROW_IN_VIEW = 5;
  const ROW_BELOW_FOLD = 250;
  // The default column width the long text wraps in before its column is measured.
  const DEFAULT_COLUMN_WIDTH = 50;

  let grid: AutoRowSizeColumnSweepPage;

  /**
   * Waits for the grid under test to store the row height the reference grid stores for the row. The
   * reference row must be taller than a one-line row, so the comparison is about the wrapped text and not
   * two default heights.
   *
   * @param {number} row Visual row index of a row with the long text.
   */
  async function expectRowHeightOfReference(row: number): Promise<void> {
    const { reference } = await grid.rowHeights(row);
    const { reference: oneLine } = await grid.rowHeights(ONE_LINE_ROW);

    expect(reference).toBeGreaterThan(oneLine ?? Infinity);
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

  test('sizes the scroll range from the heights measured after the columns are measured', async() => {
    await expectRowHeightOfReference(ROW_BELOW_FOLD);

    // The rows are measured again in idle tasks, which overwrite heights the engine had drawn: without a
    // render when they end, the scroll range keeps the old heights.
    await expect.poll(async() => {
      const heights = await grid.scrollHeights();

      return heights.grid - heights.reference;
    }).toBe(0);
  });

  test('measures the rows again once shown when the grid is hidden during the owed row measure', async() => {
    const widthBefore = await grid.columnWidth(125);

    await grid.hideGridWhenOwedRowMeasureStarts();
    await grid.loadLongTextInAnotherColumn();
    // The precondition: the grid was hidden while the measure ran, and the measure is over.
    await expect.poll(() => grid.gridHidden()).toBe(true);
    await grid.waitForSweepsToEnd();

    await grid.showGrid();
    await grid.waitForSweepsToEnd();

    expect(await grid.columnWidth(125)).toBeGreaterThan(widthBefore);
    await expectRowHeightOfReference(ROW_BELOW_FOLD);
  });

  test('measures a row below the fold again after loadData() once the columns are measured', async() => {
    // Column 125 held short values, so it is narrow when AutoRowSize measures the new rows.
    const widthBefore = await grid.columnWidth(125);

    await grid.loadLongTextInAnotherColumn();
    await grid.waitForSweepsToEnd();

    expect(await grid.columnWidth(125)).toBeGreaterThan(widthBefore);
    await expectRowHeightOfReference(ROW_BELOW_FOLD);
  });

  test('measures the last row again when it starts a chunk of the row sweep', async() => {
    // 256 rows: the sweep measures rows in chunks of 51 from row 0, so row 255 starts the sixth chunk.
    const lastRow = 255;
    const widthBefore = await grid.columnWidth(125);

    await grid.loadLongTextInLastRow();
    await grid.waitForSweepsToEnd();

    expect(await grid.columnWidth(125)).toBeGreaterThan(widthBefore);
    await expectRowHeightOfReference(lastRow);
  });
});
