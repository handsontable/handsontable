import { test, expect } from '../fixtures/test';
import { StaleHeaderWrapperPage } from '../fixtures/pages/StaleHeaderWrapperPage';

/**
 * DEV-3051 (Sentry HANDSONTABLE-COM-112). The header renderers reuse the wrapper a header cell
 * already holds, and they looked the label element up inside it with a non-null assertion. A
 * wrapper whose label element had gone missing made the next render throw
 * `can't access property "parentNode", e is null`. The grid never produces that state itself, but
 * it draws into DOM that the host page, or a browser extension, can rewrite between two draws.
 */
test.describe('header cell with a missing label element', () => {
  let grid: StaleHeaderWrapperPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new StaleHeaderWrapperPage(page, theme, bundle);
    await grid.goto();
  });

  test('rebuilds a column header on the next render instead of throwing', async () => {
    await grid.removeColumnHeaderLabel(1);
    await expect(grid.columnHeaderLabel(1)).toHaveCount(0);

    expect(await grid.render()).toBeNull();

    await expect(grid.columnHeaderLabel(1)).toHaveText('Beta');
    await expect(grid.columnHeaderLabel(0)).toHaveText('Alpha');
    await expect(grid.columnHeaderLabel(2)).toHaveText('Gamma');
    expect(grid.pageErrors).toEqual([]);
  });

  test('rebuilds a row header on the next render instead of throwing', async () => {
    await grid.removeRowHeaderLabel(1);
    await expect(grid.rowHeaderLabel(1)).toHaveCount(0);

    expect(await grid.render()).toBeNull();

    await expect(grid.rowHeaderLabel(1)).toHaveText('Second');
    await expect(grid.rowHeaderLabel(0)).toHaveText('First');
    expect(grid.pageErrors).toEqual([]);
  });
});
