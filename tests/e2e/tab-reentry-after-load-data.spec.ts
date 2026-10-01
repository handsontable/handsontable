import { test, expect } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

/**
 * Shift+Tab into the grid from below returns to the cell that last held the focus. That cell
 * belongs to the data the grid showed then, so `loadData()` drops it and the next entry starts
 * at the grid's bottom-end cell instead.
 */
test.describe('Tab re-entry after loadData', () => {
  let grid: GridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new GridPage(page, theme, bundle);
    await grid.goto();
  });

  test('returns to the last focused cell while the data stays the same', async () => {
    const field = await grid.appendFieldBelow();

    await grid.selectCell(1, 1);
    await field.click();
    await expect.poll(() => grid.selected()).toBeNull();

    await grid.page.keyboard.press('Shift+Tab');

    await expect.poll(() => grid.selected()).toEqual([[1, 1, 1, 1]]);
  });

  test('starts at the bottom-end cell once loadData replaced the data', async () => {
    const field = await grid.appendFieldBelow();

    await grid.selectCell(1, 1);
    await field.click();
    await expect.poll(() => grid.selected()).toBeNull();

    await grid.loadData([['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']]);
    await field.focus();
    await grid.page.keyboard.press('Shift+Tab');

    await expect.poll(() => grid.selected()).toEqual([[2, 2, 2, 2]]);
  });
});
