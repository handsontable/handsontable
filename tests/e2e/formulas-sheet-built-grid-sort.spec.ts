import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FormulasSheetBuiltGridSortPage } from '../fixtures/pages/FormulasSheetBuiltGridSortPage';

/**
 * A grid built from an engine sheet without `data` and sorted by a header click. The index syncer
 * was not pointed at the bound sheet, so the first sort threw
 * `Cannot read properties of null (reading 'getSheetDimensions')` and the rows stayed unsorted.
 */
test.describe('Formulas: sorting a grid built from an engine sheet', { tag: BUNDLES_TAG }, () => {
  test('sorts by a header click without throwing', async ({ page, theme, bundle }) => {
    const grid = new FormulasSheetBuiltGridSortPage(page, theme, bundle);
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));

    await grid.goto();
    await expect(grid.cell(0, 0)).toHaveText('b');

    await grid.sortByHeader(1);

    await expect(grid.cell(0, 0)).toHaveText('a');
    await expect(grid.cell(0, 2)).toHaveText('2');
    await expect.poll(() => grid.dataAtCol(1)).toEqual([1, 2, 3]);
    expect(pageErrors).toEqual([]);
  });
});
