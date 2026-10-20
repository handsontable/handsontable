import { test, expect } from '../fixtures/test';
import { SheetsBarFrozenColumnsPage } from '../fixtures/pages/SheetsBarFrozenColumnsPage';

/**
 * A switch onto a sheet with a stored selection used to keep the departing sheet's selection
 * through `loadData()`, whose selection refresh replayed it against the arriving sheet. A cell
 * that lands inside the arriving sheet's frozen columns was then looked up in the inline-start
 * overlay before that overlay had drawn the arriving sheet, and the switch threw
 * "TD or TH was expected to be rendered but is not", leaving the stored selection unrestored.
 */
test.describe('SheetsBar switching onto a sheet with frozen columns', () => {
  let grid: SheetsBarFrozenColumnsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SheetsBarFrozenColumnsPage(page, theme, bundle);
    await grid.goto();
  });

  test('restores the stored selection when the departing one sits in the arriving frozen band', async () => {
    await grid.switchToSheet(1);
    await grid.cell(4, 4).click();
    await expect.poll(() => grid.selected()).toEqual([[4, 4, 4, 4]]);

    await grid.switchToSheet(0);
    await grid.cell(2, 1).click();
    await expect.poll(() => grid.selected()).toEqual([[2, 1, 2, 1]]);

    await grid.switchToSheet(1);

    await expect.poll(() => grid.selected()).toEqual([[4, 4, 4, 4]]);
    await expect(grid.cell(4, 4)).toHaveClass(/\bcurrent\b/);
    expect(grid.pageErrors).toEqual([]);
  });

  test('restores the stored selection on an API switch', async () => {
    expect(await grid.setActiveSheet('Frozen')).toBeNull();
    await grid.cell(4, 4).click();

    expect(await grid.setActiveSheet('Plain')).toBeNull();
    await grid.cell(2, 1).click();

    expect(await grid.setActiveSheet('Frozen')).toBeNull();
    await expect.poll(() => grid.selected()).toEqual([[4, 4, 4, 4]]);
    await expect(grid.cell(4, 4)).toHaveClass(/\bcurrent\b/);
  });

  test('a switch onto a stored selection deselects once, then restores the selection', async () => {
    expect(await grid.setActiveSheet('Frozen')).toBeNull();
    await grid.cell(4, 4).click();
    expect(await grid.setActiveSheet('Plain')).toBeNull();
    await grid.cell(2, 1).click();

    const fired = await grid.selectionHooksOfSwitch('Frozen');

    expect(fired.filter(hookName => hookName === 'afterDeselect')).toHaveLength(1);
    expect(fired[0]).toBe('afterDeselect');
    expect(fired.lastIndexOf('afterSelection')).toBeGreaterThan(0);
    await expect.poll(() => grid.selected()).toEqual([[4, 4, 4, 4]]);
  });

  test('restores the departing sheet selection on the way back', async () => {
    await grid.switchToSheet(1);
    await grid.cell(4, 4).click();
    await grid.switchToSheet(0);
    await grid.cell(2, 1).click();
    await grid.switchToSheet(1);
    await grid.switchToSheet(0);

    await expect.poll(() => grid.selected()).toEqual([[2, 1, 2, 1]]);
    await expect(grid.cell(2, 1)).toHaveClass(/\bcurrent\b/);
    expect(grid.pageErrors).toEqual([]);
  });
});
