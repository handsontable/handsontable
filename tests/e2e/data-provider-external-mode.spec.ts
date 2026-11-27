import { test, expect } from '../fixtures/test';
import { DataProviderExternalModePage, type ConflictingOption } from '../fixtures/pages/DataProviderExternalModePage';

test.describe('Pagination follows a dataProvider enabled after init', () => {
  let grid: DataProviderExternalModePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DataProviderExternalModePage(page, theme, bundle);
    await grid.goto();
  });

  test('the pager switches to the server total and back, and a dataProvider added again does not reuse the old total', async() => {
    expect(await grid.totalPages()).toBe(3);

    await grid.enableProvider();
    await expect.poll(() => grid.totalPages()).toBe(5);

    await grid.disableProvider();
    await grid.page.evaluate(() => window.hot.loadData([[1], [2], [3]]));
    await expect.poll(() => grid.totalPages()).toBe(1);

    await grid.enableProvider({ failFetch: true });
    await expect.poll(() => grid.fetchCount()).toBe(2);
    await grid.refreshPager();

    expect(await grid.totalPages()).toBe(1);
  });

  test('the pager counts the fetched rows once the dataProvider is removed without new data', async() => {
    await grid.enableProvider();
    await expect(grid.counter).toHaveText('1 - 10 of 42');
    await expect(grid.navigationLabel).toHaveText('Page 1 of 5');

    await grid.disableProvider();

    await expect(grid.counter).toHaveText('1 - 2 of 2');
    await expect(grid.navigationLabel).toHaveText('Page 1 of 1');
    expect(await grid.columnValues()).toEqual([101, 102]);
  });

  test('a server page past the last local page goes back to page 1 once the dataProvider is removed', async() => {
    await grid.enableProvider();
    await expect(grid.navigationLabel).toHaveText('Page 1 of 5');

    await grid.setPage(3);
    await expect(grid.navigationLabel).toHaveText('Page 3 of 5');

    await grid.disableProvider();

    await expect(grid.navigationLabel).toHaveText('Page 1 of 1');
    expect(await grid.currentPage()).toBe(1);
  });
});

test.describe('a dataProvider blocked by a conflicting option', () => {
  const conflictingOptions: ConflictingOption[] = ['trimRows', 'manualRowMove', 'manualColumnMove', 'multiColumnSorting'];

  for (const option of conflictingOptions) {
    test(`leaves Pagination and Filters working on the local rows (${option})`, async({ page, theme, bundle }) => {
      const grid = new DataProviderExternalModePage(page, theme, bundle);

      await grid.goto({ blockedBy: option });

      expect(await grid.dataSourceState()).toEqual({
        pluginEnabled: false,
        external: false,
        rows: 25,
        firstCell: 1,
        fetches: 0,
      });
      expect(await grid.totalPages()).toBe(3);

      await grid.filterGreaterThan(20);

      expect(await grid.columnValues()).toEqual([21, 22, 23, 24, 25]);
      expect(await grid.totalPages()).toBe(1);
    });
  }
});
