import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { SheetsBarEngineTabsPage } from '../fixtures/pages/SheetsBarEngineTabsPage';

/**
 * A grid that passes a HyperFormula instance holding several sheets to the Formulas plugin, with
 * `sheetsBar: true` and no `sheets` setting, gets one tab per engine sheet, in the engine's order and
 * named after it, and the formulas that reference other sheets calculate on every tab.
 */
test.describe('SheetsBar tabs built from a formula engine', { tag: BUNDLES_TAG }, () => {
  let grid: SheetsBarEngineTabsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarEngineTabsPage(page, theme, bundle);
    await grid.goto();
  });

  test('shows one tab per engine sheet and calculates cross-sheet formulas after a switch', async() => {
    await expect(grid.tabs()).toHaveText(['Data', 'Report', 'Summary']);
    await expect(grid.tabByName('Data')).toHaveAttribute('aria-current', 'true');
    await expect(grid.cell(0, 0)).toHaveText('1');
    await expect(grid.cell(0, 1)).toHaveText('2');
    await expect(grid.cell(1, 0)).toHaveText('3');
    await expect(grid.cell(1, 1)).toHaveText('4');

    await grid.clickTab('Report');
    await expect(grid.cell(0, 0)).toHaveText('10');

    await grid.clickTab('Data');
    await grid.typeIntoCell(0, 0, '100');
    await expect(grid.cell(0, 0)).toHaveText('100');

    await grid.clickTab('Summary');
    await expect(grid.cell(0, 0)).toHaveText('218');

    expect(await grid.consoleMessages()).toEqual([]);
    expect(grid.pageErrors).toEqual([]);
  });
});
