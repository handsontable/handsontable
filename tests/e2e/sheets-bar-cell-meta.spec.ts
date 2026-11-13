import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarCellMetaPage } from '../fixtures/pages/SheetsBarCellMetaPage';

/**
 * The bar used to keep a second copy of the cell meta the user set and paste it over every meta read.
 * The copy was applied after the cell type had expanded, so a `type` came back without its renderer and
 * validator, and it was looked up by translating an index that was already physical, so "check all" read
 * the meta of another row for a row the filters removed. The meta now lives in core's cell meta only,
 * and a return writes the sheet's snapshot back before the cell types expand.
 */
test.describe('SheetsBar keeps the cell meta of a sheet across a round trip', { tag: THEMES_TAG }, () => {
  let grid: SheetsBarCellMetaPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarCellMetaPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('brings a cell type back with its renderer and validator', async() => {
    await grid.setCellMeta(1, 2, 'type', 'numeric');
    await grid.setCellMeta(0, 2, 'type', 'numeric');
    await expect(grid.cell(1, 2)).toHaveClass(/\bhtNumeric\b/);

    await grid.roundTrip();

    await expect(grid.cell(1, 2)).toHaveClass(/\bhtNumeric\b/);
    expect(await grid.editorType(1, 2)).toBe('numeric');
    expect(await grid.validateAndRead(0, 2)).toBe(false);
    expect(await grid.validateAndRead(1, 2)).toBe(true);
  });

  test('checks every writable row and skips the read-only ones after a round trip under a filter', async() => {
    await grid.setCellMeta(2, 0, 'readOnly', true);
    await grid.setCellMeta(3, 0, 'readOnly', true);
    await grid.filterByTag('a');
    await expect.poll(() => grid.rowCount()).toBe(3);

    await grid.roundTrip();

    await expect.poll(() => grid.rowCount()).toBe(3);
    await grid.checkAll();

    await expect.poll(() => grid.checkboxColumn()).toEqual([true, true, false, false, true]);
  });
});
