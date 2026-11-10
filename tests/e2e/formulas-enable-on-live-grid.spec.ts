import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FormulasEnableOnLiveGridPage } from '../fixtures/pages/FormulasEnableOnLiveGridPage';

/**
 * Formulas turned on with `updateSettings()` on a grid that already shows its rows. Nothing pointed the
 * index syncer at the sheet the enable filled, so a sort by a header click threw on develop
 * (`Cannot read properties of null (reading 'getSheetDimensions')`) and, once guarded, reordered the
 * rows while the formula column kept the results of the rows it started on (`1|6, 2|2, 3|4`).
 */
test.describe('Formulas: enabled on a live grid', { tag: BUNDLES_TAG }, () => {
  let grid: FormulasEnableOnLiveGridPage;
  let pageErrors: string[];

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulasEnableOnLiveGridPage(page, theme, bundle);
    pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await grid.goto();
  });

  test('sorts the formula column by a header click after the enable', async() => {
    await grid.enableFormulas();
    await expect(grid.cell(0, 1)).toHaveText('6');

    await grid.sortByHeader(0);

    await expect(grid.cell(0, 0)).toHaveText('1');
    await expect(grid.cell(0, 1)).toHaveText('2');
    await expect.poll(() => grid.data()).toEqual([[1, 2], [2, 4], [3, 6]]);
    await expect.poll(() => grid.engineValues()).toEqual([[1, 2], [2, 4], [3, 6]]);
    expect(pageErrors).toEqual([]);
  });

  test('brings the engine to the order of a grid sorted before the enable', async() => {
    await grid.sortByHeader(0);
    await expect(grid.cell(0, 0)).toHaveText('1');

    await grid.enableFormulas();

    await expect(grid.cell(0, 1)).toHaveText('2');
    await expect.poll(() => grid.data()).toEqual([[1, 2], [2, 4], [3, 6]]);
    await expect.poll(() => grid.engineValues()).toEqual([[1, 2], [2, 4], [3, 6]]);
    expect(pageErrors).toEqual([]);
  });
});
