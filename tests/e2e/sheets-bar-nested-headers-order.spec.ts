import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarNestedHeadersOrderPage } from '../fixtures/pages/SheetsBarNestedHeadersOrderPage';

/**
 * A sheet's column order comes back on a return through `setIndexesSequence()`, which reports an
 * `'update'` and not a `'move'`. NestedHeaders re-derived its header tree on a move only, so after a
 * switch away and back the moved columns showed the headers of the columns that had been there before
 * the move.
 */
test.describe('SheetsBar return to a sheet with nested headers and a moved column', { tag: THEMES_TAG }, () => {
  let grid: SheetsBarNestedHeadersOrderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarNestedHeadersOrderPage(page, theme, bundle);
    await grid.goto();
  });

  test('labels every column with its own headers after a round trip', async() => {
    await grid.moveColumn(2, 0);

    await expect(grid.header(1, 0)).toHaveText('Qty');

    await grid.switchToSheet(1);
    await grid.switchToSheet(0);

    expect(await grid.firstRow()).toEqual([5, 1, 'alpha', 'yes']);
    await expect(grid.header(1, 0)).toHaveText('Qty');
    await expect(grid.header(1, 1)).toHaveText('ID');
    await expect(grid.header(1, 2)).toHaveText('Name');
    await expect(grid.header(1, 3)).toHaveText('Done');
    await expect(grid.header(0, 0)).toHaveText('Order');
    await expect(grid.header(0, 1)).toHaveText('Customer');
    expect(grid.pageErrors).toEqual([]);
  });
});
