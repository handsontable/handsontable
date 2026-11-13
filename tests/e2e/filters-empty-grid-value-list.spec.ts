import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

/**
 * A grid with no rows has no values to filter by. `getDataAtCol()` reads one `null` from such a
 * grid, which the "Filter by value" list must not show as a "(Blank cells)" item.
 */
test.describe('Filters — "filter by value" list on a grid with no rows', () => {
  test('lists no "(Blank cells)" item once every row is removed', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();
    await page.evaluate(() => (window as unknown as {
      hot: { alter: (action: string, index: number, amount: number) => void }
    }).hot.alter('remove_row', 0, 5));
    await expect.poll(() => grid.columnCells(0).count()).toBe(0);

    await grid.openEmptyMenu('Name');

    expect(await grid.listedValues()).toEqual([]);
  });
});
