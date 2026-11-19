import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarPluginLeftoversPage } from '../fixtures/pages/SheetsBarPluginLeftoversPage';

/**
 * CollapsibleColumns marks the NestedHeaders groups collapsible after a data load, from its own
 * `afterLoadData`. NestedHeaders rebuilds its header state from its `afterLoadData` too, which runs
 * later and resets those marks. So a sheet declaring `nestedHeaders` never showed the collapse
 * buttons, and on a plain grid a `loadData()` took away the buttons an `updateSettings()` had shown.
 */
test.describe('CollapsibleColumns buttons over NestedHeaders', { tag: THEMES_TAG }, () => {
  let grid: SheetsBarPluginLeftoversPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarPluginLeftoversPage(page, theme, bundle);
  });

  test('a sheet declaring nested headers shows a collapse button that collapses its group', async() => {
    await grid.goto('collapsible-workbook');
    await expect(grid.collapsibleIndicators()).toHaveCount(0);

    await grid.switchToSheet(1);

    await expect(grid.collapsibleIndicators()).toHaveCount(1);
    await expect(grid.collapsibleIndicators()).toHaveClass(/\bexpanded\b/);

    await grid.collapsibleIndicators().click();

    await expect(grid.collapsibleIndicators()).toHaveClass(/\bcollapsed\b/);
    await expect(grid.cell(0, 1)).toHaveCount(0);
  });

  test('the collapse button stays after a round trip', async() => {
    await grid.goto('collapsible-workbook');

    await grid.switchToSheet(1);
    await grid.switchToSheet(0);
    await expect(grid.collapsibleIndicators()).toHaveCount(0);

    await grid.switchToSheet(1);

    await expect(grid.collapsibleIndicators()).toHaveCount(1);
    expect(grid.pageErrors).toEqual([]);
  });

  test('a plain grid keeps the collapse button through a data load', async() => {
    await grid.goto('collapsible-plain');

    await grid.enableNestedHeaders();
    await expect(grid.collapsibleIndicators()).toHaveCount(1);

    await grid.loadFreshData();

    await expect(grid.collapsibleIndicators()).toHaveCount(1);

    await grid.collapsibleIndicators().click();

    await expect(grid.collapsibleIndicators()).toHaveClass(/\bcollapsed\b/);
  });
});
