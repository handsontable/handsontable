import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { OrdersGridPage } from '../fixtures/pages/OrdersGridPage';

/**
 * Pagination over a filtered and sorted grid: the page count and the counter follow the filter, each
 * page shows its slice of the sorted rows, and a column selected from its header on one page is that
 * page's rows only, so Delete empties them and leaves the other pages as they were.
 *
 * The cross-browser visual suite photographed these steps on the demo's pagination route
 * (`pagination.spec.ts`: filter, sort, next page, select a column and press Delete, next page,
 * previous page) and asserted nothing; since DEV-3257 the first screenshot is the only one left,
 * and the pages are asserted here. Its column step clicks the middle of the Name column's header,
 * which lands on the header's label, and a press on a sortable header's label sorts as well as
 * selects, so from there the pages are in Name order — the screenshots show it ("Name ↑"), and this
 * spec asserts it rather than hide it. The click here aims at the label itself, so it does not depend
 * on where the middle of the header falls.
 *
 * The expected rows are worked out from the source data in the test, independently of the grid:
 * the countries that contain "in", sorted by the clicked column.
 */
test.describe('pagination over a filtered and sorted grid', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: OrdersGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new OrdersGridPage(page, theme, bundle, '10');
    await grid.goto();
  });

  test('pages through the filtered rows, and a column cleared on one page stays cleared there only', async({
    page,
  }) => {
    expect(await grid.pageState()).toMatchObject({ currentPage: 1, totalPages: 6, counter: '1 - 10 of 60' });

    const source = await grid.sourceData();
    const kept = source.filter(row => String(row[6]).toLowerCase().includes('in'));
    const byColumn = (column: number) => [...kept].sort((a, b) => String(a[column]).localeCompare(String(b[column])));
    const slice = (rows: unknown[][], column: number, from: number) => rows.slice(from, from + 10).map(row => row[column]);

    // "Clear", search "In", "Select all", OK: five countries contain "in", thirty rows.
    await grid.keepSearchedValues('Country', 'In', ['Argentina', 'China', 'India', 'Philippines', 'United Kingdom']);
    await grid.sortBy(0, 'ascending');

    expect(await grid.pageState()).toEqual({
      currentPage: 1,
      totalPages: 3,
      firstVisibleRowIndex: 0,
      lastVisibleRowIndex: 9,
      counter: '1 - 10 of 30',
      navigation: 'Page 1 of 3',
    });
    expect((await grid.columnData(0)).slice(0, 10)).toEqual(slice(byColumn(0), 0, 0));

    await grid.turnPage('next');

    expect(await grid.pageState()).toMatchObject({ currentPage: 2, counter: '11 - 20 of 30', navigation: 'Page 2 of 3' });
    expect((await grid.columnData(0)).slice(10, 20)).toEqual(slice(byColumn(0), 0, 10));

    // The Name header's label: a click sorts by Name and selects the column, on this page's rows only.
    await grid.header(1).locator('.colHeader').click();

    expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(await grid.selected()).toEqual([[10, 1, 19, 1]]);
    expect(await grid.pageState()).toMatchObject({ currentPage: 2, counter: '11 - 20 of 30' });

    const names = slice(byColumn(1), 1, 0).concat(slice(byColumn(1), 1, 10), slice(byColumn(1), 1, 20));

    expect(await grid.columnData(1)).toEqual(names);

    await page.keyboard.press('Delete');

    const cleared = [...names.slice(0, 10), ...Array(10).fill(null), ...names.slice(20)];

    await expect.poll(async() => grid.columnData(1)).toEqual(cleared);

    await grid.turnPage('next');

    expect(await grid.pageState()).toMatchObject({ currentPage: 3, counter: '21 - 30 of 30', navigation: 'Page 3 of 3' });
    expect((await grid.columnData(1)).slice(20, 30)).toEqual(names.slice(20));

    await grid.turnPage('prev');

    expect(await grid.pageState()).toMatchObject({ currentPage: 2, counter: '11 - 20 of 30', navigation: 'Page 2 of 3' });
    expect((await grid.columnData(1)).slice(10, 20)).toEqual(Array(10).fill(null));
  });
});
