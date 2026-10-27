import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

/**
 * DEV-507: a merge made while a row sits between the rows it covers in the row order, and that row is
 * trimmed or filtered out, has to cover the row once it comes back. It used to span only the rows it had
 * been made over, so it drew over the returning row, hid its values, and stopped one row short, which
 * left its own last row uncovered and empty.
 *
 * The fixture holds `A1`, `B1`, ... by row, so a value on the wrong record is visible in the assertion.
 * The merge covers visual rows 1 to 3 of columns A and B while physical row 2 is out of view, so it owns
 * the physical rows 1, 3 and 4.
 */
test.describe('a merge made while a row between its rows is out of view', () => {
  let grid: UndoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
  });

  async function expectOneBlockOverRows(firstRow: number, lastRow: number) {
    await expect(grid.cell(firstRow, 0)).toHaveAttribute('rowspan', String(lastRow - firstRow + 1));

    for (let row = firstRow + 1; row <= lastRow; row++) {
      await expect(grid.cell(row, 0)).toBeHidden();
      await expect(grid.cell(row, 1)).toBeHidden();
    }
  }

  test('spans the trimmed row and its own last row when the rows come back', async() => {
    await grid.initGrid({ mergeCells: true, trimRows: [2] });
    await grid.mergeWithShortcut([1, 0, 3, 1]);

    await expect.poll(() => grid.merges()).toEqual([[1, 0, 3, 2]]);
    await expectOneBlockOverRows(1, 3);

    await grid.untrimAll();

    await expect.poll(() => grid.merges()).toEqual([[1, 0, 4, 2]]);
    await expectOneBlockOverRows(1, 4);
    // The rows around the block are drawn on their own, with their own values.
    await expect(grid.cell(0, 0)).toHaveText('A1');
    await expect(grid.cell(5, 0)).toHaveText('A6');
    await expect(grid.cell(5, 1)).toHaveText('B6');
  });

  test('keeps the values of the returning row in the source data', async() => {
    await grid.initGrid({ mergeCells: true, trimRows: [2] });
    await grid.mergeWithShortcut([1, 0, 3, 1]);
    await grid.untrimAll();

    await expect.poll(() => grid.merges()).toEqual([[1, 0, 4, 2]]);

    const returningRow = await grid.page.evaluate(() => window.hot.getSourceDataAtRow(2));

    expect(returningRow).toEqual(['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3']);
  });

  test('does the same for a row a filter removes from view', async() => {
    await grid.initGrid({ mergeCells: true, filters: true });
    await grid.filterOutValue(0, 'A3');
    await grid.mergeWithShortcut([1, 0, 3, 1]);

    await expect.poll(() => grid.merges()).toEqual([[1, 0, 3, 2]]);

    await grid.clearFilters();

    await expect.poll(() => grid.merges()).toEqual([[1, 0, 4, 2]]);
    await expectOneBlockOverRows(1, 4);
    await expect(grid.cell(5, 0)).toHaveText('A6');
  });

  test('shrinks to the visible rows again when a row is trimmed again', async() => {
    await grid.initGrid({ mergeCells: true, trimRows: [2] });
    await grid.mergeWithShortcut([1, 0, 3, 1]);
    await grid.untrimAll();
    await expect.poll(() => grid.merges()).toEqual([[1, 0, 4, 2]]);

    await grid.trimRows([2]);

    await expect.poll(() => grid.merges()).toEqual([[1, 0, 3, 2]]);
    await expectOneBlockOverRows(1, 3);
  });

  test('is undone and redone with the trimming it was made under', async() => {
    await grid.initGrid({ mergeCells: true, trimRows: [2] });
    await grid.mergeWithShortcut([1, 0, 3, 1]);
    await grid.untrimAll();
    await expect.poll(() => grid.merges()).toEqual([[1, 0, 4, 2]]);

    // Bringing the rows back is a step of its own, so the first undo trims the row again.
    await grid.undo();
    await expect.poll(() => grid.merges()).toEqual([[1, 0, 3, 2]]);

    await grid.undo();
    await expect.poll(() => grid.merges()).toEqual([]);

    await grid.redo();
    await expect.poll(() => grid.merges()).toEqual([[1, 0, 3, 2]]);

    await grid.redo();
    await expect.poll(() => grid.merges()).toEqual([[1, 0, 4, 2]]);
    await expectOneBlockOverRows(1, 4);
  });
});
