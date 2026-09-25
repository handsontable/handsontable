import { test, expect } from '../fixtures/test';
import { NestedRowsSheetSwitchPage } from '../fixtures/pages/NestedRowsSheetSwitchPage';

/**
 * DEV-3042: a sheet switch runs `loadData()`, and NestedRows drops its collapsed state on every
 * load. The sheets bar did not carry the collapsed parents in a sheet's view state, so a branch
 * collapsed on one sheet came back expanded after a round-trip through another sheet.
 */
test.describe('NestedRows collapse state across a sheet switch', () => {
  let grid: NestedRowsSheetSwitchPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new NestedRowsSheetSwitchPage(page, theme, bundle);
    await grid.goto();
  });

  test('a branch collapsed from the row header stays collapsed after a round-trip', async () => {
    await grid.collapseButton(0).click();
    await expect.poll(() => grid.visibleNames()).toEqual(['Europe', 'Asia', 'Japan']);

    await grid.switchToSheet(1);
    await expect.poll(() => grid.visibleNames()).toEqual(['Fruit', 'Apple', 'Vegetables', 'Carrot']);

    await grid.switchToSheet(0);
    await expect.poll(() => grid.visibleNames()).toEqual(['Europe', 'Asia', 'Japan']);
    await expect(grid.cell(1, 0)).toHaveText('Asia');
  });

  test('each sheet keeps its own collapsed branches', async () => {
    await grid.collapseButton(0).click();
    await grid.switchToSheet(1);
    await grid.collapseButton(2).click();
    await expect.poll(() => grid.visibleNames()).toEqual(['Fruit', 'Apple', 'Vegetables']);

    await grid.switchToSheet(0);
    await expect.poll(() => grid.visibleNames()).toEqual(['Europe', 'Asia', 'Japan']);

    await grid.switchToSheet(1);
    await expect.poll(() => grid.visibleNames()).toEqual(['Fruit', 'Apple', 'Vegetables']);
  });
});
