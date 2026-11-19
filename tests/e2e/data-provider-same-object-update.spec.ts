import { test, expect } from '../fixtures/test';
import { DataProviderSameObjectUpdatePage } from '../fixtures/pages/DataProviderSameObjectUpdatePage';

test.describe('a settings update that sends the same dataProvider object again', () => {
  let grid: DataProviderSameObjectUpdatePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DataProviderSameObjectUpdatePage(page, theme, bundle);
    await grid.goto();

    await grid.sortLabel(0).click();
    await grid.sortLabel(0).click();
    await expect(grid.firstIdCell()).toHaveText('50');

    await grid.nextPageButton.click();
    await expect(grid.pageCounter).toHaveText('11 - 20 of 50');
    await expect(grid.firstIdCell()).toHaveText('40');
  });

  test('keeps the rows, the page and the sort on screen and sends no request when it also sends `data`', async() => {
    const fetchesBefore = (await grid.fetchCalls()).length;

    expect(await grid.sendSameProvider({ data: [] })).toEqual({ rows: 10, firstId: 40, fetches: fetchesBefore });

    await expect(grid.pageCounter).toHaveText('11 - 20 of 50');
    await expect(grid.firstIdCell()).toHaveText('40');
    await expect(grid.sortLabel(0)).toHaveClass(/descending/);

    await grid.settleFrames();

    expect(await grid.fetchCalls()).toHaveLength(fetchesBefore);

    await grid.sendSameProvider({ pagination: { pageSize: 20, pageSizeList: [10, 20] } });
    await grid.settleFrames();

    expect(await grid.fetchCalls()).toHaveLength(fetchesBefore + 1);
  });

  test('refetches with the sort kept when it also sends another page size', async() => {
    const fetchesBefore = (await grid.fetchCalls()).length;

    expect((await grid.sendSameProvider({ pagination: { pageSize: 20, pageSizeList: [10, 20] } })).fetches)
      .toBe(fetchesBefore + 1);

    await expect(grid.pageCounter).toHaveText('1 - 20 of 50');
    await expect(grid.firstIdCell()).toHaveText('50');
    await expect(grid.sortLabel(0)).toHaveClass(/descending/);

    const calls = await grid.fetchCalls();

    expect(calls[calls.length - 1]).toEqual({ page: 1, pageSize: 20, sort: { prop: 'id', order: 'desc' } });
  });
});
