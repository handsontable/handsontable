import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarImportPage } from '../fixtures/pages/SheetsBarImportPage';

/**
 * A file imported into one sheet lays out that sheet only. The import used to write its column types,
 * locks, sizes and headers as grid-level settings, which reached every other sheet, and it installed its
 * cell styles in the grid's one stylesheet, which the next import into another sheet replaced while the
 * first sheet's cells still carried the classes.
 */
test.describe('SheetsBar keeps an imported file on its own sheet', { tag: THEMES_TAG }, () => {
  let grid: SheetsBarImportPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarImportPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('leaves the other sheet editable after a protected file is imported into one sheet', async() => {
    await grid.showSheet(1);
    await grid.importFixture('styles');

    expect(await grid.opensEditor(1, 1)).toBe(true);
    expect(await grid.opensEditor(0, 0)).toBe(false);

    await grid.showSheet(0);

    expect(await grid.columnCount()).toBe(3);
    expect(await grid.opensEditor(0, 0)).toBe(true);

    await grid.showSheet(1);

    expect(await grid.opensEditor(0, 0)).toBe(false);
  });

  test('keeps a sheet\'s imported cell styles after another sheet imports a file', async() => {
    await grid.importFixture('styles');
    await expect(grid.cell(0, 0)).toHaveCSS('font-weight', '700');

    await grid.showSheet(1);
    await grid.importFixture('values');
    await grid.showSheet(0);

    await expect(grid.cell(0, 0)).toHaveCSS('font-weight', '700');
  });
});
