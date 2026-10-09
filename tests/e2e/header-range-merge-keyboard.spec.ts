import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { GridLayoutsPage } from '../fixtures/pages/GridLayoutsPage';

/**
 * Shift+Arrow on a selection made from the headers extends it by one column or row, whatever merged
 * cells the range crosses. A merged cell snaps a range of cells, but a header range runs the whole
 * length of the grid, so it crosses every merge in its columns and the plugin must not grow the range
 * to the merge's edge. The mouse already behaves this way: a Shift+click on the next header adds one
 * column, and so does Shift+ArrowRight with `mergeCells: false`.
 *
 * The `large` shape (150 x 150) gets two merges: a horizontal one over columns 0-9 of the first row,
 * which every column range among them crosses, and a vertical one over rows 2-9 of column 40, which
 * every row range among them crosses. Two more cases keep a merge wholly on the start side of an
 * E-W or S-N range, because the snap reads the merge's far edge there. The nested-rows shape is the
 * grid of the report: parent rows merged across all columns, with a hidden column the extension has
 * to skip.
 */

const MERGES = [
  { row: 0, col: 0, rowspan: 1, colspan: 10 },
  { row: 2, col: 40, rowspan: 8, colspan: 1 },
];

test.describe('Shift+Arrow on a header selection ignores the merged cells it crosses', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: GridLayoutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridLayoutsPage(page, theme, bundle);
  });

  /**
   * Opens the `large` shape and puts the given merges on it.
   *
   * @param {object[]} mergeCells The merged areas.
   */
  async function openLarge(mergeCells: object[]): Promise<void> {
    await grid.goto('large');
    await grid.updateSettings({ mergeCells });
  }

  test('extends a column selection by one column on Shift+ArrowRight', async({ page }) => {
    await openLarge(MERGES);
    await grid.clickColumnHeader(3);
    await page.keyboard.press('Shift+ArrowRight');

    expect(await grid.selected()).toEqual([[-1, 3, 149, 4]]);
  });

  test('extends a column range made with Shift+click by one column on Shift+ArrowRight', async({ page }) => {
    await openLarge(MERGES);
    await grid.clickColumnHeader(3);
    await grid.clickColumnHeader(5, ['Shift']);
    await page.keyboard.press('Shift+ArrowRight');

    expect(await grid.selected()).toEqual([[-1, 3, 149, 6]]);
  });

  test('extends a column selection by one column on Shift+ArrowLeft', async({ page }) => {
    await openLarge(MERGES);
    await grid.clickColumnHeader(3);
    await page.keyboard.press('Shift+ArrowLeft');

    expect(await grid.selected()).toEqual([[-1, 3, 149, 2]]);
  });

  test('extends a right-to-left column range past a merge on its start side by one column', async({ page }) => {
    await openLarge([{ row: 0, col: 0, rowspan: 1, colspan: 3 }]);
    await grid.clickColumnHeader(5);
    await grid.clickColumnHeader(3, ['Shift']);
    await page.keyboard.press('Shift+ArrowLeft');

    expect(await grid.selected()).toEqual([[-1, 5, 149, 2]]);
  });

  test('extends a row selection by one row on Shift+ArrowDown', async({ page }) => {
    await openLarge(MERGES);
    await grid.clickRowHeader(5);
    await page.keyboard.press('Shift+ArrowDown');

    expect(await grid.selected()).toEqual([[5, -1, 6, 149]]);
  });

  test('extends a row selection by one row on Shift+ArrowUp', async({ page }) => {
    await openLarge(MERGES);
    await grid.clickRowHeader(5);
    await page.keyboard.press('Shift+ArrowUp');

    expect(await grid.selected()).toEqual([[5, -1, 4, 149]]);
  });

  test('extends a bottom-to-top row range past a merge on its start side by one row', async({ page }) => {
    await openLarge([{ row: 2, col: 40, rowspan: 3, colspan: 1 }]);
    await grid.clickRowHeader(7);
    await grid.clickRowHeader(5, ['Shift']);
    await page.keyboard.press('Shift+ArrowUp');

    expect(await grid.selected()).toEqual([[7, -1, 4, 149]]);
  });

  test('skips the hidden column when it extends a column selection on the nested-rows shape', async({ page }) => {
    await grid.goto('nested-rows');
    await grid.clickColumnHeader(0);
    await page.keyboard.press('Shift+ArrowRight');

    const { rows } = await grid.size();

    // Column 1 is hidden, so the next column the grid draws is 2.
    expect(await grid.selected()).toEqual([[-1, 0, rows - 1, 2]]);
  });

  test('skips the hidden rows when it extends a row selection on the nested-rows shape', async({ page }) => {
    await grid.goto('nested-rows');
    await grid.clickRowHeader(2);
    await page.keyboard.press('Shift+ArrowDown');

    const { columns } = await grid.size();

    // Rows 3-5 are hidden, so the next row the grid draws is 6.
    expect(await grid.selected()).toEqual([[2, -1, 6, columns - 1]]);
  });

  test('leaves the perpendicular arrows of a header selection as they are', async({ page }) => {
    await openLarge(MERGES);
    await grid.clickColumnHeader(3);
    await page.keyboard.press('Shift+ArrowDown');

    expect(await grid.selected()).toEqual([[-1, 3, 149, 3]]);

    await grid.clickRowHeader(5);
    await page.keyboard.press('Shift+ArrowRight');

    expect(await grid.selected()).toEqual([[5, -1, 5, 149]]);
  });

  test('still snaps a cell selection to the merge it reaches after a header selection', async({ page }) => {
    await openLarge(MERGES);
    await grid.clickColumnHeader(3);
    await grid.selectCell(0, 3);
    await page.keyboard.press('Shift+ArrowRight');

    // The selection starts inside the merge over columns 0-9, so it takes the whole merge and then one
    // more column.
    expect(await grid.selected()).toEqual([[0, 0, 0, 10]]);
  });
});
