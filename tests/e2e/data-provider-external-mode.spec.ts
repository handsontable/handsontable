import { test, expect } from '../fixtures/test';
import { DataProviderExternalModePage } from '../fixtures/pages/DataProviderExternalModePage';

test.describe('Pagination follows a dataProvider enabled after init', () => {
  let grid: DataProviderExternalModePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DataProviderExternalModePage(page, theme, bundle);
    await grid.goto();
  });

  test('the pager switches to the server total and back', async() => {
    expect(await grid.totalPages()).toBe(3);

    await grid.enableProvider();
    await expect.poll(() => grid.totalPages()).toBe(5);

    await grid.disableProvider();
    await grid.page.evaluate(() => window.hot.loadData([[1], [2], [3]]));
    await expect.poll(() => grid.totalPages()).toBe(1);
  });
});
