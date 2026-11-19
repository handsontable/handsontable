import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarPluginLeftoversPage } from '../fixtures/pages/SheetsBarPluginLeftoversPage';

/**
 * ColumnSummary writes its total into the data array it summarizes. When the grid replaced that
 * array, the total stayed in it, and loading the array again summed the old total as input: a
 * grid-level summary over a sheet grew 3, 6, 9, 12 on each round trip, and the grown total was
 * stored in the sheet's data. The plain-grid analogue is `loadData()` of the same array.
 */
test.describe('ColumnSummary total over replaced data', { tag: THEMES_TAG }, () => {
  let grid: SheetsBarPluginLeftoversPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarPluginLeftoversPage(page, theme, bundle);
  });

  test('a sheet shows the same total after every round trip', async() => {
    await grid.goto('summary-workbook');
    await expect(grid.cell(3, 0)).toHaveText('3');

    for (let round = 0; round < 3; round++) {
      await grid.switchToSheet(1);
      await expect(grid.cell(3, 0)).toHaveText('15');

      await grid.switchToSheet(0);
      await expect(grid.cell(3, 0)).toHaveText('3');
    }

    expect(grid.pageErrors).toEqual([]);
  });

  test('a sheet away keeps the original destination value in its data', async() => {
    await grid.goto('summary-workbook');

    await grid.switchToSheet(1);

    expect(await grid.declaredSheetData('A')).toEqual([[1], [1], [1], [null]]);
  });

  test('a plain grid shows the same total when the same array is loaded again', async() => {
    await grid.goto('summary-plain');
    await expect(grid.cell(3, 0)).toHaveText('3');

    for (let round = 0; round < 3; round++) {
      await grid.loadDeclaredData('B');
      await expect(grid.cell(3, 0)).toHaveText('15');

      await grid.loadDeclaredData('A');
      await expect(grid.cell(3, 0)).toHaveText('3');
    }

    expect(await grid.declaredSheetData('B')).toEqual([[5], [5], [5], [null]]);
  });
});
