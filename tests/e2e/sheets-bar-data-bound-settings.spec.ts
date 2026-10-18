import { test, expect } from '../fixtures/test';
import { SheetsBarDataBoundSettingsPage } from '../fixtures/pages/SheetsBarDataBoundSettingsPage';

/**
 * A switch applies the arriving sheet's `settings` while the grid still holds the departing
 * sheet's data, and loads the arriving data after. A plugin that reads the data when its settings
 * are applied therefore read the wrong sheet: NestedRows judged a flat array and turned itself
 * off, and ColumnSummary checked its endpoints against the departing sheet's size and wrote its
 * results into that sheet's data. Separately, the reset of a never-visited sheet cleared the
 * merges after it brought hidden and trimmed rows back, so the merged cell kept its `rowspan`.
 */
test.describe('SheetsBar settings that read the data', () => {
  let grid: SheetsBarDataBoundSettingsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SheetsBarDataBoundSettingsPage(page, theme, bundle);
  });

  test('NestedRows stays on when a switch lands on a nested sheet', async () => {
    await grid.goto('nestedRows');

    await grid.switchTo('Tree');

    expect(await grid.consoleMessages()).toEqual([]);
    expect(await grid.isPluginEnabled('nestedRows')).toBe(true);
    expect(await grid.countRows()).toBe(2);
    await expect(grid.cell(0, 0)).toHaveText('Parent');
    await expect(grid.cell(1, 0)).toHaveText('Child');
  });

  test('NestedRows survives a round trip through the flat sheet', async () => {
    await grid.goto('nestedRows');

    await grid.switchTo('Tree', 'Plain');

    expect(await grid.isPluginEnabled('nestedRows')).toBe(false);
    await expect(grid.cell(0, 0)).toHaveText('a');

    await grid.switchTo('Tree');

    expect(await grid.consoleMessages()).toEqual([]);
    expect(await grid.isPluginEnabled('nestedRows')).toBe(true);
    await expect(grid.cell(1, 0)).toHaveText('Child');
  });

  test('ColumnSummary is checked against the arriving sheet', async () => {
    await grid.goto('columnSummary');

    await grid.switchTo('Big');

    expect(await grid.consoleMessages()).toEqual([]);
    expect(await grid.dataAtCell(9, 4)).toBe(2 * 9 + 10 * (0 + 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8));
  });

  test('ColumnSummary writes nothing into the departing sheet', async () => {
    await grid.goto('columnSummary');

    await grid.switchTo('Wide', 'Big', 'Wide');

    expect(await grid.declaredSheetCell(2, 9, 4)).toBe(94);
    expect(await grid.dataAtCell(9, 4)).toBe(94);
  });

  test('a merged cell leaves no span behind on a sheet without merges', async () => {
    await grid.goto('mergeCells');
    await expect(grid.spannedCells()).toHaveCount(1);

    await grid.switchTo('C', 'A');

    await expect(grid.spannedCells()).toHaveCount(0);
  });
});
