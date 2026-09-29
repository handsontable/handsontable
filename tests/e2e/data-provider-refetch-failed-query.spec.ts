import { test, expect } from '../fixtures/test';
import { DataProviderRefetchFailedQueryPage } from '../fixtures/pages/DataProviderRefetchFailedQueryPage';

/**
 * The error toast's Refetch action retries the request that failed.
 *
 * A failed page or page-size change leaves the pager on the previous state, because the query is
 * stored only after a successful fetch. Refetch must still ask the server for what the user
 * requested, and once that succeeds the grid must show it. Sort and filter changes store their
 * query before fetching, so their retries are pinned here too. Once a later fetch has succeeded,
 * an old toast's Refetch reloads the current state rather than rolling the grid back.
 */
test.describe('dataProvider Refetch after a failed fetch', () => {
  let grid: DataProviderRefetchFailedQueryPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DataProviderRefetchFailedQueryPage(page, theme, bundle);
    await grid.goto();
  });

  test('Refetch after a failed page change loads the requested page', async() => {
    await grid.setServerFailing(true);
    await grid.nextPageButton.click();

    await expect(grid.refetchButton).toBeVisible();
    await expect(grid.pageCounter).toHaveText('1 - 10 of 50');

    await grid.setServerFailing(false);
    await grid.refetchButton.click();

    await expect(grid.pageCounter).toHaveText('11 - 20 of 50');
    await expect(grid.firstIdCell()).toHaveText('11');
    await expect(grid.refetchButton).toBeHidden();
    expect((await grid.fetchCalls()).map(({ page, pageSize }) => ({ page, pageSize }))).toEqual([
      { page: 1, pageSize: 10 },
      { page: 2, pageSize: 10 },
      { page: 2, pageSize: 10 },
    ]);
  });

  test('Refetch after a failed page-size change loads the requested page size', async() => {
    await grid.setServerFailing(true);
    await grid.pageSizeSelect.selectOption('20');

    await expect(grid.refetchButton).toBeVisible();
    await expect(grid.pageSizeSelect).toHaveValue('10');

    await grid.setServerFailing(false);
    await grid.refetchButton.click();

    await expect(grid.pageCounter).toHaveText('1 - 20 of 50');
    await expect(grid.pageSizeSelect).toHaveValue('20');
    await expect(grid.rows).toHaveCount(20);
    await expect(grid.refetchButton).toBeHidden();
    expect((await grid.fetchCalls()).map(({ page, pageSize }) => ({ page, pageSize }))).toEqual([
      { page: 1, pageSize: 10 },
      { page: 1, pageSize: 20 },
      { page: 1, pageSize: 20 },
    ]);
  });

  test('Refetch after a failed sort loads the sorted rows and keeps the sort indicator', async() => {
    await grid.setServerFailing(true);
    await grid.sortLabel(0).click();
    await grid.sortLabel(0).click();

    await expect(grid.refetchButton.first()).toBeVisible();

    await grid.setServerFailing(false);
    await grid.refetchButton.last().click();

    await expect(grid.firstIdCell()).toHaveText('50');
    await expect(grid.sortLabel(0)).toHaveClass(/descending/);
    await expect(grid.refetchButton).toHaveCount(1);

    const calls = await grid.fetchCalls();

    expect(calls[calls.length - 1].sort).toEqual({ prop: 'id', order: 'desc' });
  });

  test('Refetch after a failed filter loads the filtered rows and keeps the filter', async() => {
    await grid.setServerFailing(true);
    await grid.filterByValue(1, 'Record 7');

    await expect(grid.refetchButton).toBeVisible();

    await grid.setServerFailing(false);
    await grid.refetchButton.click();

    await expect(grid.rows).toHaveCount(1);
    await expect(grid.firstIdCell()).toHaveText('7');
    await expect(grid.pageCounter).toHaveText('1 - 1 of 1');
    expect(await grid.filterConditions()).toHaveLength(1);

    const calls = await grid.fetchCalls();

    expect(calls[calls.length - 1].filters).toEqual([
      { prop: 'name', operation: 'conjunction', conditions: [{ name: 'eq', args: ['record 7'] }] },
    ]);
  });

  test('after a later successful fetch, an old toast\'s Refetch reloads the current state', async() => {
    await grid.setServerFailing(true);
    await grid.nextPageButton.click();

    await expect(grid.refetchButton).toBeVisible();

    await grid.setServerFailing(false);
    await grid.sortLabel(0).click();
    await grid.sortLabel(0).click();

    await expect(grid.sortLabel(0)).toHaveClass(/descending/);
    await expect(grid.firstIdCell()).toHaveText('50');

    await grid.refetchButton.click();

    await expect(grid.refetchButton).toBeHidden();
    await expect.poll(async() => (await grid.fetchCalls()).length).toBe(5);
    await expect(grid.pageCounter).toHaveText('1 - 10 of 50');
    await expect(grid.sortLabel(0)).toHaveClass(/descending/);
    await expect(grid.firstIdCell()).toHaveText('50');

    const calls = await grid.fetchCalls();

    expect(calls[calls.length - 1]).toEqual({ page: 1, pageSize: 10, sort: { prop: 'id', order: 'desc' }, filters: null });
  });
});
