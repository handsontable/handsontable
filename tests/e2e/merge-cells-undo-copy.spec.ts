import { randomUUID } from 'node:crypto';
import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * A merge marks the cells it covers as not copyable and gives its top-left cell a span. Once the
 * merge is undone, the cells are plain cells again: a copy of the area holds every value, and the
 * top-left cell reports no span. The clipboard outlives a test, so the last copied cell gets a value
 * unique to the run first, and a copy that drops it cannot pass on an earlier run's text.
 */
test.describe('copy after the undo of a merge', () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid({ mergeCells: true, contextMenu: true });
  });

  /**
   * Gives C3 a value of this run, copies B2:C3 with the keyboard, and checks the clipboard and the
   * cell meta of the area.
   */
  async function expectPlainCellsCopied(): Promise<void> {
    const unique = randomUUID();

    await grid.setCell(2, 2, unique);
    await grid.copyWithKeyboard([1, 1, 2, 2]);

    await expect.poll(() => grid.clipboardText()).toBe(`B2\tC2\nB3\t${unique}`);
    expect(await grid.page.evaluate(() => {
      const { rowspan, colspan } = window.hot.getCellMeta(1, 1);

      return { rowspan, colspan, copyable: window.hot.getCellMeta(2, 2).copyable };
    })).toEqual({ rowspan: undefined, colspan: undefined, copyable: true });
  }

  test('copies every value after Ctrl+M and Ctrl+Z', async () => {
    await grid.mergeWithShortcut([1, 1, 2, 2]);
    await expect.poll(() => grid.merges()).toEqual([[1, 1, 2, 2]]);

    await grid.undoWithKeyboard();
    await expect.poll(() => grid.merges()).toEqual([]);

    await expectPlainCellsCopied();
  });

  test('copies every value after Merge cells from the context menu and Ctrl+Z', async ({ page }) => {
    await page.evaluate(() => window.hot.selectCells([[1, 1, 2, 2]]));
    await grid.openContextMenuOnCell(1, 1);
    await grid.chooseContextMenuItem('Merge cells');
    await expect.poll(() => grid.merges()).toEqual([[1, 1, 2, 2]]);

    await grid.undoWithKeyboard();
    await expect.poll(() => grid.merges()).toEqual([]);

    await expectPlainCellsCopied();
  });
});
