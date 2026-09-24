import { test, expect } from '../fixtures/test';
import { DataProviderSheetsBarPage } from '../fixtures/pages/DataProviderSheetsBarPage';

/**
 * DEV-3041: DataProvider works per sheet under SheetsBar.
 *
 * "Orders" and "Customers" declare their own `dataProvider`; "Notes" holds local rows. A
 * grid-level `dataProvider` (behind `?gridLevel`) is disabled for every sheet that does not
 * declare its own, with one console warning. A local sheet's ColumnSorting/Filters stay
 * client-side and are never overwritten by a server sheet's in-flight fetch.
 */
test.describe('dataProvider with sheetsBar', () => {
  let grid: DataProviderSheetsBarPage;

  test.afterEach(async() => {
    expect(await grid.consoleProblems()).toEqual([]);
  });

  test.describe('setup', () => {
    test('a sheet that declares dataProvider loads from its own server (rule 1)', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();

      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);
      expect(await grid.fetchCount('ORD')).toBe(1);
    });

    test('a grid-level dataProvider is disabled with one warning (rule 2)', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ gridLevel: true });

      await grid.clickTab(1);
      await grid.clickTab(0);
      await grid.clickTab(1);

      expect(await grid.fetchCount('GRID')).toBe(0);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      const problems = await grid.consoleProblems();

      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain('dataProvider');
      await page.evaluate(() => { (window as unknown as { htServer: { consoleProblems: string[] } }).htServer.consoleProblems = []; });
    });
  });

  test.describe('working on a sheet', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
    });

    test('a local sheet sorts and filters client-side and is never overwritten (rule 11)', async() => {
      await grid.clickTab(1);
      await grid.sortByHeader(0, 'desc');
      await grid.filterColumnByValue(0, ['NOTE-3', 'NOTE-1']);

      expect(await grid.ids()).toEqual(['NOTE-3', 'NOTE-1']);
      expect(await grid.fetchCount('ORD')).toBe(1);
      expect(await grid.pendingCount()).toBe(0);
    });
  });

  test.describe('moving between sheets', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
    });

    test('first visit to a server sheet fetches it (rule 3)', async() => {
      await grid.clickTab(2);
      await expect(grid.loadingOverlayVisible()).toBeVisible();
      expect(await grid.release('CUS')).toBe(1);
      await expect(grid.cell(0, 0)).toHaveText('CUS-01');
    });

    test('returning restores rows, sort, filters, page and total without fetching (rule 4)', async() => {
      await grid.sortByHeader(0, 'desc');
      await grid.release('ORD');
      await grid.filterColumn(0, 'contains', ['ORD-0']);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-09');
      await grid.goToPage(2);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-04');
      const before = {
        ids: await grid.ids(),
        sort: await grid.sortConfig(),
        filters: await grid.filterConditions(),
        pagination: await grid.pagination(),
      };
      const fetchesBefore = await grid.fetchCount('ORD');

      expect(before.ids).toEqual(['ORD-04', 'ORD-03', 'ORD-02', 'ORD-01']);
      expect(before.filters).toHaveLength(1);
      expect(before.pagination).toEqual({ currentPage: 2, pageSize: 5, totalPages: 2 });

      await grid.clickTab(1);
      await grid.clickTab(0);

      expect(await grid.fetchCount('ORD')).toBe(fetchesBefore);
      expect(await grid.ids()).toEqual(before.ids);
      expect(await grid.sortConfig()).toEqual(before.sort);
      expect(await grid.filterConditions()).toEqual(before.filters);
      expect(await grid.pagination()).toEqual(before.pagination);
      expect((await grid.events()).at(-1)).toBe(`afterFetch ${before.ids[0]}`);
    });

    test('returning to a sorted server sheet keeps the server order instead of sorting locally', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ serverSemantics: 'custom' });
      await grid.sortByHeader(0, 'desc');
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-24');
      const serverPage = await grid.ids();
      const fetchesBefore = await grid.fetchCount('ORD');

      expect(serverPage).toEqual(['ORD-24', 'ORD-25', 'ORD-22', 'ORD-23', 'ORD-20']);

      await grid.clickTab(1);
      const eventsBeforeReturn = (await grid.events()).length;

      await grid.clickTab(0);

      expect(await grid.ids()).toEqual(serverPage);
      expect(await grid.sortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
      expect(await grid.fetchCount('ORD')).toBe(fetchesBefore);
      expect((await grid.events()).slice(eventsBeforeReturn)).toEqual([`afterFetch ${serverPage[0]}`]);
    });

    test('returning to a filtered server sheet keeps the server result instead of filtering locally', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ serverSemantics: 'custom' });
      await grid.filterColumn(0, 'contains', ['ORD-1']);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-01');
      const serverPage = await grid.ids();
      const filters = await grid.filterConditions();
      const fetchesBefore = await grid.fetchCount('ORD');

      expect(serverPage).toEqual(['ORD-01', 'ORD-10', 'ORD-11', 'ORD-12', 'ORD-13']);

      await grid.clickTab(1);
      await grid.clickTab(0);

      expect(await grid.ids()).toEqual(serverPage);
      expect(await grid.filterConditions()).toEqual(filters);
      expect(await grid.fetchCount('ORD')).toBe(fetchesBefore);
    });

    test('leaving mid-fetch stores the rows in the sheet it was started for (rule 5)', async() => {
      await grid.startFetch();
      await grid.clickTab(1);
      await grid.release('ORD');
      await grid.clickTab(0);

      await expect(grid.cell(0, 1)).toHaveText('#2');
      expect(await grid.fetchCount('ORD')).toBe(2);
      expect((await grid.events()).filter(e => e.startsWith('afterFetch'))).toEqual([
        'afterFetch ORD-01',
        'afterFetch ORD-01',
      ]);

      await grid.clickTab(1);

      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
    });

    test('a memoized fetchRows that returns the same array does not empty the sheet it lands in', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ cachedRows: true });
      await grid.startFetch();
      await grid.clickTab(1);
      await grid.release('ORD');
      await grid.clickTab(0);

      await expect(grid.cell(0, 0)).toHaveText('ORD-01');
      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);
      expect(await grid.fetchCount('ORD')).toBe(2);
    });

    test('an off-screen page clamp refetches with the query of the fetch it corrects', async() => {
      await grid.goToPage(5);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-21');
      await grid.sortByHeader(0, 'desc');

      expect(await grid.pendingParams('ORD')).toEqual(expect.objectContaining({
        page: 5, sort: { prop: 'id', order: 'desc' },
      }));

      await grid.setServerTotalRows(10);
      await grid.clickTab(1);
      await grid.release('ORD');

      await expect.poll(() => grid.pendingParams('ORD')).toEqual(expect.objectContaining({
        page: 2, sort: { prop: 'id', order: 'desc' },
      }));

      await grid.release('ORD');
      await grid.clickTab(0);

      await expect(grid.cell(0, 0)).toHaveText('ORD-05');
      expect(await grid.ids()).toEqual(['ORD-05', 'ORD-04', 'ORD-03', 'ORD-02', 'ORD-01']);
      expect(await grid.sortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
      expect((await grid.pagination()).currentPage).toBe(2);
    });

    test('returning while the fetch is still running waits for it (rule 6)', async() => {
      await grid.startFetch();
      await grid.clickTab(1);
      await expect(grid.loadingOverlayVisible()).toBeHidden();
      await grid.clickTab(0);

      expect(await grid.pendingCount('ORD')).toBe(1);
      await expect(grid.loadingOverlayVisible()).toBeVisible();
      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText('#2');
      expect(await grid.fetchCount('ORD')).toBe(2);
    });

    test('leaving mid-fetch hides the loading overlay on the next sheet', async() => {
      await grid.startFetch();
      await expect(grid.loadingOverlayVisible()).toBeVisible();
      await grid.clickTab(1);
      await expect(grid.loadingOverlayVisible()).toBeHidden();
    });

    test('local sheet after a paged server sheet shows its own rows (review focus 1)', async() => {
      await grid.goToPage(3);
      await grid.release('ORD');
      await grid.clickTab(1);

      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect((await grid.pagination()).currentPage).toBe(1);
    });

    test('a canceled switch leaves the fetch running on the current sheet (rule 9)', async() => {
      await grid.startFetch();
      await grid.cancelNextSwitch();
      await grid.clickTab(1);

      expect(await grid.activeSheetIndex()).toBe(0);
      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);
      expect(await grid.pendingCount('ORD')).toBe(1);

      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText('#2');
      expect(await grid.activeSheetIndex()).toBe(0);
    });

    test('fetchData() fetches the visible sheet (rule 12)', async() => {
      await grid.clickTab(2);
      await grid.release('CUS');
      await grid.startFetch();

      expect(await grid.pendingCount('CUS')).toBe(1);
      expect(await grid.pendingCount('ORD')).toBe(0);
    });

    test('updateSettings({ dataProvider }) still refetches (rule 13)', async() => {
      await grid.page.evaluate(() => {
        const hot = window.hot as unknown as {
          getSettings(): { dataProvider: object };
          updateSettings(settings: Record<string, unknown>): void;
        };
        const own = hot.getSettings().dataProvider;

        hot.updateSettings({ dataProvider: { ...own } });
      });

      expect(await grid.pendingCount('ORD')).toBe(1);

      await grid.release('ORD');

      await expect(grid.cell(0, 1)).toHaveText('#2');
      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);
      expect(await grid.activeSheetIndex()).toBe(0);
    });

    test('sort after returning to a pending sheet supersedes the pending fetch (review focus 2)', async() => {
      await grid.startFetch();
      await grid.clickTab(1);
      await grid.clickTab(0);
      await grid.sortByHeader(0, 'desc');

      expect(await grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-25');
    });
  });

  test.describe('off-screen failures and in-flight saves', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
    });

    test('an off-screen failure fires the hook now and shows the toast on return (rule 7)', async() => {
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.clickTab(1);
      await grid.release('ORD');

      expect(await grid.events()).toContain('afterError ORD failed');
      expect(await grid.toast().count()).toBe(0);

      await grid.clickTab(0);
      await expect(grid.toast()).toBeVisible();
      expect(await grid.pendingCount('ORD')).toBe(0);
      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);
      expect((await grid.events()).filter(event => event === 'afterError ORD failed')).toHaveLength(1);

      await grid.closeToast();
      await expect(grid.toast()).toHaveCount(0);
      await grid.clickTab(1);
      await grid.clickTab(0);
      await expect(grid.cell(0, 0)).toHaveText('ORD-01');
      expect(await grid.toast().count()).toBe(0);
    });

    test('the deferred toast brings back the sheet\'s sort and page (rule 7)', async() => {
      await grid.sortByHeader(0, 'desc');
      await grid.release('ORD');
      await grid.goToPage(2);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-20');
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.clickTab(1);
      await grid.release('ORD');
      await grid.clickTab(0);

      await expect(grid.toast()).toBeVisible();
      expect(await grid.sortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
      expect((await grid.pagination()).currentPage).toBe(2);
      expect(await grid.ids()).toEqual(['ORD-20', 'ORD-19', 'ORD-18', 'ORD-17', 'ORD-16']);
    });

    test('Refetch from the deferred toast loads the sheet (review focus 5)', async() => {
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.clickTab(1);
      await grid.release('ORD');
      await grid.clickTab(0);
      await grid.toast().getByRole('button', { name: 'Refetch' }).click();
      await grid.release('ORD');

      await expect(grid.cell(0, 1)).toHaveText('#3');
      await expect(grid.toast()).toHaveCount(0);
      await expect(grid.loadingOverlayVisible()).toBeHidden();

      await grid.clickTab(1);
      await grid.clickTab(0);
      await expect(grid.cell(0, 1)).toHaveText('#3');
      expect(await grid.toast().count()).toBe(0);
      expect(await grid.fetchCount('ORD')).toBe(3);
    });

    test('a save in flight refetches the sheet it was made on (rule 8)', async() => {
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');

      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      await grid.clickTab(0);
      await expect(grid.cell(0, 1)).toHaveText('#2');
    });

    test('a save that fails off-screen leaves the visible sheet alone and reloads its own sheet', async() => {
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.failNextUpdate();
      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);

      await expect(grid.cell(0, 1)).toHaveText('-');
      expect(await grid.toast().count()).toBe(0);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('Row update failed:')]);
      await grid.clearConsoleProblems();

      await grid.release('ORD');
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      await grid.clickTab(0);
      await expect(grid.cell(0, 1)).toHaveText('#2');
      await expect(grid.toast()).toHaveCount(1);
      await expect(grid.toast()).toContainText('Could not update rows');

      await grid.closeToast();
      await expect(grid.toast()).toHaveCount(0);
      await grid.clickTab(1);
      await grid.clickTab(0);
      await expect(grid.cell(0, 1)).toHaveText('#2');
      expect(await grid.toast().count()).toBe(0);
    });

    test('an edit queued behind a slow save sends the rows of the sheet it was made on', async() => {
      await grid.editCell(0, 1, 'first');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.editCell(1, 1, 'second');
      await grid.clickTab(1);
      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);

      expect(await grid.updatePayloads()).toEqual([
        [{ id: 'ORD-01', changes: { fetch: 'first' } }],
        [{ id: 'ORD-02', changes: { fetch: 'second' } }],
      ]);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);

      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');
      await grid.clickTab(0);
      await expect(grid.cell(1, 1)).toHaveText('#3');
    });

    test('a create in flight refetches the sheet it was made on', async() => {
      await grid.startCreateRow('ORD-05');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');

      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      await grid.clickTab(0);
      await expect(grid.cell(0, 1)).toHaveText('#2');
    });

    test('a remove in flight refetches the page of the sheet it was made on', async() => {
      await grid.goToPage(5);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-21');
      await grid.startRemoveRows(['ORD-21', 'ORD-22', 'ORD-23']);
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.setServerTotalRows(22);
      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);

      expect((await grid.pendingParams('ORD'))?.page).toBe(5);
      await grid.release('ORD');
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      await grid.clickTab(0);
      expect(await grid.ids()).toEqual(['ORD-21', 'ORD-22']);
      expect((await grid.pagination()).currentPage).toBe(5);
    });
  });

  test.describe('a grid without sheets', () => {
    test('a save refetches with the dataProvider set while it was pending', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ plain: true });

      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.replaceDataProvider('CUS');
      await expect.poll(() => grid.pendingCount('CUS')).toBe(1);
      await grid.releaseUpdates();
      await expect.poll(() => grid.fetchCount('CUS')).toBe(2);

      expect(await grid.fetchCount('ORD')).toBe(1);
      expect(await grid.pendingCount('ORD')).toBe(0);
      await grid.release('CUS');
      await expect(grid.cell(0, 0)).toHaveText('CUS-01');
    });
  });
});
