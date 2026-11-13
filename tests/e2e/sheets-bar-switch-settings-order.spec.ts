import { test, expect } from '../fixtures/test';
import { SheetsBarSwitchSettingsOrderPage } from '../fixtures/pages/SheetsBarSwitchSettingsOrderPage';

/**
 * A switch applied the arriving sheet's settings while the grid still held the departing sheet's
 * data, and `loadData()` then cleared the cell meta those settings wrote. Settings that describe the
 * loaded cells (`cell`, `customBorders`, `columnSummary`) are now applied after the load, core's
 * automatic row removal is held back while the departing rows are loaded, and a runtime freeze comes
 * off the grid before the arriving settings land.
 */
test.describe('SheetsBar applies a sheet against its own data', () => {
  let grid: SheetsBarSwitchSettingsOrderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarSwitchSettingsOrderPage(page, theme, bundle);
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps the rows typed into spare rows when the next sheet has another `columns` schema', async() => {
    await grid.goto('spareRows');

    await grid.typeInto(2, 0, 'o-3');
    await grid.typeInto(3, 0, 'o-4');
    await expect(grid.cell(3, 0)).toHaveText('o-4');

    await grid.openSheet('Customers');

    expect(await grid.declaredSheetColumn(0, 0)).toEqual(['o-1', 'o-2', 'o-3', 'o-4', null]);

    await grid.openSheet('Orders');

    await expect(grid.cell(2, 0)).toHaveText('o-3');
    await expect(grid.cell(3, 0)).toHaveText('o-4');
  });

  test('keeps a cell the sheet declares read-only locked at open and after a round trip', async({ page }) => {
    await grid.goto('cellOption');

    await grid.cell(0, 0).dblclick();

    expect(await grid.isEditorOpened()).toBe(false);

    await grid.openSheet('Beta');
    await grid.openSheet('Alpha');
    await grid.cell(0, 0).click();
    await page.keyboard.press('Enter');

    expect(await grid.isEditorOpened()).toBe(false);

    await grid.typeInto(0, 1, 'edited');
    await expect(grid.cell(0, 1)).toHaveText('edited');
    await expect(grid.cell(0, 0)).toHaveText('locked');
  });

  test('opens a sheet declaring the same frozen row as the previous sheet with that row frozen', async() => {
    await grid.goto('sameFreeze');

    await expect.poll(() => grid.frozenTopRowCount()).toBe(1);

    await grid.openSheet('B');

    await expect.poll(() => grid.frozenTopRowCount()).toBe(1);

    await grid.openSheet('A');

    await expect.poll(() => grid.frozenTopRowCount()).toBe(1);
  });

  test('keeps a declared border on a sheet larger than the sheet the user arrives from', async() => {
    await grid.goto('largerBorders');

    await grid.openSheet('Large');

    expect(await grid.bordersAt(5, 2)).toBe(1);
    await expect(grid.cell(5, 2)).toBeVisible();
  });

  test('keeps a summary where a row insert moved it after a round trip', async() => {
    await grid.goto('movedSummary');

    await grid.openSheet('Totals');
    await expect(grid.cell(2, 0)).toHaveText('3');

    await grid.insertRowAbove(2);
    await grid.typeInto(2, 0, '7');
    await expect(grid.cell(3, 0)).toHaveText('3');

    await grid.openSheet('Notes');
    await grid.openSheet('Totals');

    await expect(grid.cell(2, 0)).toHaveText('7');
    await expect(grid.cell(3, 0)).toHaveText('3');
    expect(await grid.declaredSheetColumn(1, 0)).toEqual([1, 2, '7', 3]);
  });

  test('switches onto a sheet with deeper nested headers that turns collapsible columns off', async() => {
    await grid.goto('deeperHeaders');

    await grid.openSheet('Deep');

    await expect.poll(() => grid.columnHeaderLevels()).toBe(2);
    await expect(grid.tab('Flat')).not.toHaveAttribute('aria-current', 'true');
  });
});
