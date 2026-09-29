import { test, expect } from '../fixtures/test';
import { DataProviderSheetsBarPage } from '../fixtures/pages/DataProviderSheetsBarPage';

/**
 * DataProvider works per sheet under SheetsBar.
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
    test('a sheet that declares dataProvider loads from its own server', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();

      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);
      expect(await grid.fetchCount('ORD')).toBe(1);
    });

    test('a grid-level dataProvider is disabled with one warning', async({ page, theme, bundle }) => {
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

    test('a local sheet sorts and filters client-side and is never overwritten', async() => {
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

    test('first visit to a server sheet fetches it', async() => {
      await grid.clickTab(2);
      await expect(grid.loadingOverlayVisible()).toBeVisible();
      expect(await grid.release('CUS')).toBe(1);
      await expect(grid.cell(0, 0)).toHaveText('CUS-01');
    });

    test('returning restores rows, sort, filters, page and total without fetching', async() => {
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

    test('leaving mid-fetch stores the rows in the sheet it was started for', async() => {
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

    test('returning while the fetch is still running waits for it', async() => {
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

    test('local sheet after a paged server sheet shows its own rows', async() => {
      await grid.goToPage(3);
      await grid.release('ORD');
      await grid.clickTab(1);

      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect((await grid.pagination()).currentPage).toBe(1);
    });

    test('a canceled switch leaves the fetch running on the current sheet', async() => {
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

    test('fetchData() fetches the visible sheet', async() => {
      await grid.clickTab(2);
      await grid.release('CUS');
      await grid.startFetch();

      expect(await grid.pendingCount('CUS')).toBe(1);
      expect(await grid.pendingCount('ORD')).toBe(0);
    });

    test('updateSettings({ dataProvider }) still refetches', async() => {
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

    test('sort after returning to a pending sheet supersedes the pending fetch', async() => {
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

    test('an off-screen failure fires the hook now and shows the toast on return', async() => {
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

    test('the deferred toast brings back the sheet\'s sort and page', async() => {
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

    test('Refetch from the deferred toast loads the sheet', async() => {
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

    test('a save in flight refetches the sheet it was made on', async() => {
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

  test.describe('remove and duplicate', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
    });

    test('removing a server sheet mid-fetch aborts silently', async() => {
      await grid.startFetch();
      await grid.removeSheet(0);

      expect(await grid.pendingCount('ORD')).toBe(0);
      expect((await grid.events()).at(-1)).toBe('afterAbort');
      await expect(grid.toast()).toHaveCount(0);
    });

    test('remove a background sheet with a detached fetch', async() => {
      await grid.startFetch();
      await grid.clickTab(1);
      await grid.removeSheet(0);

      expect(await grid.pendingCount('ORD')).toBe(0);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
    });

    test('a duplicate starts with a full snapshot and fetches nothing on its first visit', async() => {
      await grid.sortByHeader(0, 'desc');
      await grid.release('ORD');
      await grid.goToPage(2);
      await grid.release('ORD');
      const snapshot = { ids: await grid.ids(), sort: await grid.sortConfig(), pagination: await grid.pagination() };
      const fetches = await grid.fetchCount('ORD');

      await grid.duplicateSheet(0);
      await grid.clickTab(1);

      expect(await grid.fetchCount('ORD')).toBe(fetches);
      expect(await grid.ids()).toEqual(snapshot.ids);
      expect(await grid.sortConfig()).toEqual(snapshot.sort);
      expect(await grid.pagination()).toEqual(snapshot.pagination);

      await grid.goToPage(3);
      expect(await grid.pendingCount('ORD')).toBe(1);
    });

    test('duplicate while the original is fetching', async() => {
      await grid.startFetch();
      await grid.duplicateSheet(0);
      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText('#2');

      await grid.clickTab(1);
      await expect(grid.cell(0, 1)).toHaveText('#1');
    });

    test('destroy aborts every fetch', async() => {
      await grid.startFetch();
      await grid.clickTab(2);
      await grid.page.evaluate(() => window.hot.destroy());

      expect(await grid.pendingCount()).toBe(0);
      expect(await grid.consoleProblems()).toEqual([]);
      expect(grid.pageErrors).toEqual([]);
    });
  });

  test.describe('a sheet data array the host declared', () => {
    test('is replaced, not written into, when an off-screen response lands', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ frozenOrders: true, releaseInitialFetch: false });

      await grid.clickTab(1);
      await grid.release('ORD');

      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect((await grid.events()).filter(event => event.startsWith('afterError'))).toEqual([]);

      await grid.clickTab(0);

      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);
      expect(await grid.fetchCount('ORD')).toBe(1);
      await expect(grid.toast()).toHaveCount(0);
      expect(await page.evaluate(() => {
        const { htOrdersData } = window as unknown as { htOrdersData: unknown[] };

        return { frozen: Object.isFrozen(htOrdersData), length: htOrdersData.length };
      })).toEqual({ frozen: true, length: 0 });
      expect(grid.pageErrors).toEqual([]);
    });
  });

  test.describe('an off-screen failure and user error listeners', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ userErrorListeners: true });
    });

    test('an off-screen fetch failure is kept as a fetch failure: Refetch on return, no automatic refetch', async() => {
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.clickTab(1);
      await grid.release('ORD');
      const fetchesBeforeReturn = await grid.fetchCount('ORD');

      await grid.clickTab(0);

      await expect(grid.toast()).toHaveCount(1);
      await expect(grid.toast().getByRole('button', { name: 'Refetch' })).toBeVisible();
      await expect(grid.toast()).not.toContainText('Could not update rows');
      expect(await grid.pendingCount('ORD')).toBe(0);
      expect(await grid.fetchCount('ORD')).toBe(fetchesBeforeReturn);
      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);

      await grid.toast().getByRole('button', { name: 'Refetch' }).click();
      await grid.release('ORD');
      await expect(grid.toast()).toHaveCount(0);
      await expect(grid.cell(0, 1)).toHaveText(`#${fetchesBeforeReturn + 1}`);
    });

    test('an off-screen update failure is kept as an update failure, shown once on return', async() => {
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.failNextUpdate();
      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');

      await expect(grid.toast()).toHaveCount(0);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('Row update failed:')]);
      await grid.clearConsoleProblems();

      await grid.clickTab(0);

      await expect(grid.toast()).toHaveCount(1);
      await expect(grid.toast()).toContainText('Could not update rows');
      await expect(grid.toast().getByRole('button', { name: 'Refetch' })).toHaveCount(0);
    });
  });

  test.describe('a save of a grid without sheets still pending when the sheets bar is enabled', () => {
    test('fails without reverting into, refetching for, or toasting on the new workbook', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ plain: true });
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);

      await grid.setSheets(1);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      const fetchesBefore = await grid.fetchCount('ORD');

      await grid.failNextUpdate();
      await grid.releaseUpdates();
      await expect.poll(() => grid.events()).toContain('afterMutationError update');

      await expect(grid.cell(0, 1)).toHaveText('-');
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect(await grid.fetchCount('ORD')).toBe(fetchesBefore);
      await expect(grid.toast()).toHaveCount(0);
      expect(await grid.consoleProblems()).toEqual([
        expect.stringContaining('dataProvider'),
        expect.stringContaining('Row update failed:'),
      ]);
      await grid.clearConsoleProblems();
    });
  });

  test.describe('returning while a save\'s refetch of the sheet is still running', () => {
    test('replays the saved response first, then the refetch lands', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);

      await grid.clickTab(1);
      const payloadsBeforeReturn = (await grid.fetchPayloads()).length;

      await grid.clickTab(0);

      expect(await grid.pendingCount('ORD')).toBe(1);
      await expect(grid.loadingOverlayVisible()).toBeHidden();
      expect((await grid.fetchPayloads()).slice(payloadsBeforeReturn)).toEqual([{ first: 'ORD-01', restored: true }]);

      await grid.release('ORD');

      await expect(grid.cell(0, 1)).toHaveText('#2');
      expect((await grid.fetchPayloads()).slice(payloadsBeforeReturn)).toEqual([
        { first: 'ORD-01', restored: true },
        { first: 'ORD-01', restored: false },
      ]);
    });
  });

  test.describe('the view state DataProvider brings in line on a switch', () => {
    test('returning to a sheet whose fetch still runs works without the EmptyDataState plugin', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ noEmptyDataState: true });
      await grid.startFetch();
      await grid.clickTab(1);
      await grid.clickTab(0);

      expect(await grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText('#2');
      expect(grid.pageErrors).toEqual([]);
    });

    test('a sheet without a stored response refetches with its own query, not the previous sheet\'s', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.clickTab(2);
      await grid.failNext('CUS');
      await grid.clickTab(1);
      await grid.release('CUS');
      await grid.sortByHeader(0, 'desc');
      await expect(grid.cell(0, 0)).toHaveText('NOTE-3');

      await grid.clickTab(2);
      await expect(grid.toast()).toHaveCount(1);
      await grid.toast().getByRole('button', { name: 'Refetch' }).click();

      await expect.poll(() => grid.pendingCount('CUS')).toBe(1);
      expect(await grid.pendingParams('CUS')).toEqual(expect.objectContaining({ page: 1, sort: null }));
      await grid.release('CUS');
      await expect(grid.cell(0, 0)).toHaveText('CUS-01');
      expect(await grid.sortConfig()).toEqual([]);
    });

    test('an off-screen page clamp does not raise the loading overlay on the sheet in view', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.startFetch({ page: 5 });
      await grid.clickTab(1);
      await grid.setServerTotalRows(6);
      await grid.release('ORD');
      await expect.poll(() => grid.pendingParams('ORD')).toEqual(expect.objectContaining({ page: 2 }));

      await expect(grid.loadingOverlayVisible()).toBeHidden();
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);

      await grid.release('ORD');
      await expect(grid.loadingOverlayVisible()).toBeHidden();
    });

    test('a fetch error notification goes back to its sheet on a switch, and its Refetch loads that sheet', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.release('ORD');
      await expect(grid.toast()).toHaveCount(1);

      await grid.clickTab(1);
      await expect(grid.toast()).toHaveCount(0);

      await grid.clickTab(0);
      await expect(grid.toast()).toHaveCount(1);
      await grid.toast().getByRole('button', { name: 'Refetch' }).click();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');
      await expect(grid.toast()).toHaveCount(0);
      await expect(grid.cell(0, 1)).toHaveText('#3');
    });

    test('every fetch error notification of a sheet leaves with it, and only the latest failure comes back', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.release('ORD');
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.release('ORD');
      await expect(grid.toast()).toHaveCount(2);

      await grid.clickTab(2);
      await expect(grid.toast()).toHaveCount(0);
      await expect.poll(() => grid.pendingCount('CUS')).toBe(1);
      await grid.release('CUS');
      await expect(grid.toast()).toHaveCount(0);

      await grid.clickTab(0);
      await expect(grid.toast()).toHaveCount(1);
      await grid.toast().getByRole('button', { name: 'Refetch' }).click();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      expect(await grid.pendingCount('CUS')).toBe(0);
    });

    test('a successful fetch hides the sheet\'s fetch error notification, which then does not come back', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.release('ORD');
      await expect(grid.toast()).toHaveCount(1);

      await grid.startFetch();
      await grid.release('ORD');
      await expect(grid.toast()).toHaveCount(0);

      await grid.clickTab(1);
      await grid.clickTab(0);
      await expect.poll(() => grid.activeSheetIndex()).toBe(0);
      await expect(grid.toast()).toHaveCount(0);
    });

    test('a dataProvider the user sets on the visible server sheet stays with that sheet', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await page.evaluate(() => {
        const { htProvider } = window as unknown as { htProvider(prefix: string): unknown };

        window.hot.updateSettings({ dataProvider: htProvider('INV') } as never);
      });
      await expect.poll(() => grid.pendingCount('INV')).toBe(1);
      await grid.release('INV');
      await expect(grid.cell(0, 0)).toHaveText('INV-01');

      await grid.clickTab(1);
      await grid.clickTab(0);
      await expect(grid.cell(0, 0)).toHaveText('INV-01');
      const ordFetches = await grid.fetchCount('ORD');

      await grid.startFetch();

      expect(await grid.pendingCount('INV')).toBe(1);
      expect(await grid.fetchCount('ORD')).toBe(ordFetches);
      await grid.release('INV');
    });
  });

  test.describe('what the sheets bar keeps for a sheet', () => {
    test('does not pass through afterDataProviderFetch listeners', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ userFetchListener: true });
      await page.evaluate(() => {
        const current = window.hot.getSettings().sheetsBar as Record<string, unknown>;

        window.hot.updateSettings({ sheetsBar: { ...current, paging: false } } as never);
      });
      await grid.goToPage(2);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-06');
      const pagerAfterLanding = await grid.pagination();

      await grid.clickTab(1);
      await grid.clickTab(0);

      expect(await grid.pagination()).toEqual(pagerAfterLanding);
      expect(await grid.fetchCount('ORD')).toBe(2);
    });
  });

  test.describe('the loading overlay when the sheets bar is enabled on a fetching grid', () => {
    test('hides once the grid\'s fetch is dropped', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ plain: true });
      await grid.startFetch();
      await expect(grid.loadingOverlayVisible()).toBeVisible();

      await grid.setSheets(1);

      expect(await grid.pendingCount('ORD')).toBe(0);
      await expect(grid.loadingOverlayVisible()).toBeHidden();
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('dataProvider')]);
      await grid.clearConsoleProblems();
    });
  });

  test.describe('destroying a grid without sheets while a mutation is running', () => {
    test('settles a running remove without errors', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ plain: true });
      await page.evaluate(() => {
        const target = window as unknown as { htRemoveOutcome?: string };

        window.hot.getPlugin('dataProvider').removeRows(['ORD-01']).then(
          () => { target.htRemoveOutcome = 'settled'; },
          (error: unknown) => { target.htRemoveOutcome = `rejected: ${String(error)}`; },
        );
      });
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);

      await page.evaluate(() => window.hot.destroy());
      expect(await grid.releaseUpdates()).toBe(1);

      await expect.poll(() => page.evaluate(() => (window as unknown as { htRemoveOutcome?: string })
        .htRemoveOutcome)).toBe('settled');
      expect(await grid.consoleProblems()).toEqual([]);
      expect(grid.pageErrors).toEqual([]);
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

    test('destroying a plain grid mid-fetch aborts silently', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ plain: true });

      await grid.sortByHeader(0, 'desc');
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.page.evaluate(() => window.hot.destroy());

      expect(await grid.pendingCount('ORD')).toBe(0);
      expect(await grid.consoleProblems()).toEqual([]);
      expect(grid.pageErrors).toEqual([]);
    });

    test('a grid without columns maps the first response\'s sort through the loaded rows', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ plain: true, noColumns: true, releaseInitialFetch: false });

      await grid.startFetch({ sort: { prop: 'fetch', order: 'desc' } });
      await expect.poll(() => grid.events()).toContain('afterAbort');
      await grid.release('ORD');

      await expect(grid.cell(0, 0)).toHaveText('ORD-25');
      expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
    });
  });

  test.describe('a grid-level dataProvider set later', () => {
    test('is blocked on a local sheet without touching its rows, sort, or filters', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.clickTab(1);
      await grid.sortByHeader(0, 'desc');
      await grid.filterColumnByValue(0, ['NOTE-3', 'NOTE-1']);
      const filters = await grid.filterConditions();

      await grid.replaceDataProvider('GRID');

      expect(await grid.hasDataProvider()).toBe(false);
      expect(await grid.ids()).toEqual(['NOTE-3', 'NOTE-1']);
      expect(await grid.sourceIds()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect(await grid.sortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
      expect(await grid.filterConditions()).toEqual(filters);
      expect(await grid.fetchCount('GRID')).toBe(0);
      await expect(grid.loadingOverlayVisible()).toBeHidden();
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('dataProvider')]);
      await grid.clearConsoleProblems();

      await grid.clickTab(0);
      await grid.clickTab(1);

      expect(await grid.ids()).toEqual(['NOTE-3', 'NOTE-1']);
      expect(await grid.sourceIds()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect(await grid.fetchCount('GRID')).toBe(0);
    });

    test('is blocked on a local sheet the workbook opened on, without emptying it', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ activeSheet: 1 });
      await grid.sortByHeader(0, 'desc');
      await grid.filterColumnByValue(0, ['NOTE-3', 'NOTE-1']);

      await grid.replaceDataProvider('GRID');

      expect(await grid.hasDataProvider()).toBe(false);
      expect(await grid.ids()).toEqual(['NOTE-3', 'NOTE-1']);
      expect(await grid.sourceIds()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect(await grid.fetchCount('GRID')).toBe(0);
      await expect(grid.loadingOverlayVisible()).toBeHidden();
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('dataProvider')]);
      await grid.clearConsoleProblems();

      await grid.clickTab(0);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-01');
      await grid.clickTab(1);

      expect(await grid.ids()).toEqual(['NOTE-3', 'NOTE-1']);
      expect(await grid.sourceIds()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
    });

    test('is blocked on a sheet that declares `dataProvider: null`', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ notesNullProvider: true });
      await grid.clickTab(1);

      await grid.replaceDataProvider('GRID');

      expect(await grid.hasDataProvider()).toBe(false);
      expect(await grid.fetchCount('GRID')).toBe(0);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('dataProvider')]);
      await grid.clearConsoleProblems();
    });
  });

  test.describe('rebuilding, enabling, and disabling the sheets bar', () => {
    test('a rebuilt workbook fetches a server sheet on its first visit', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.clickTab(2);
      await grid.release('CUS');
      await expect(grid.cell(0, 0)).toHaveText('CUS-01');
      await grid.clickTab(0);

      await grid.setSheets();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      const rebuildFetch = await grid.fetchCount('ORD');

      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText(`#${rebuildFetch}`);

      await grid.clickTab(2);

      expect(await grid.pendingCount('CUS')).toBe(1);
      await expect(grid.loadingOverlayVisible()).toBeVisible();
      await grid.release('CUS');
      await expect(grid.cell(0, 1)).toHaveText('#2');
    });

    test('leaving a rebuilt workbook\'s first fetch keeps its rows out of the local sheet', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();

      await grid.setSheets();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      const rebuildFetch = await grid.fetchCount('ORD');

      await grid.clickTab(1);
      await grid.release('ORD');

      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);

      await grid.clickTab(0);

      await expect(grid.cell(0, 1)).toHaveText(`#${rebuildFetch}`);
      expect(await grid.fetchCount('ORD')).toBe(rebuildFetch);
    });

    test('a rebuild keeps a grid-level dataProvider blocked without fetching it', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ gridLevel: true });
      await grid.clearConsoleProblems();

      await grid.setSheets();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      const rebuildFetch = await grid.fetchCount('ORD');

      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText(`#${rebuildFetch}`);
      await grid.clickTab(1);

      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect(await grid.hasDataProvider()).toBe(false);
      expect(await grid.fetchCount('GRID')).toBe(0);
    });

    test('turning the sheets bar off gives the grid its own dataProvider back', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ gridLevel: true });
      await grid.clearConsoleProblems();
      await grid.clickTab(1);

      await grid.disableSheetsBar();

      expect(await grid.hasDataProvider()).toBe(true);
      await expect.poll(() => grid.pendingCount('GRID')).toBe(1);
      await grid.release('GRID');
      await expect(grid.cell(0, 0)).toHaveText('GRID-01');
    });

    test('a save queued before a rebuild that fails afterwards leaves the new workbook alone', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);

      await grid.setSheets();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      const rebuildFetch = await grid.fetchCount('ORD');

      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText(`#${rebuildFetch}`);

      await grid.failNextUpdate();
      await grid.releaseUpdates();
      await expect.poll(() => grid.events()).toContain('afterMutationError update');

      expect(await grid.page.evaluate(() => window.hot.getDataAtCol(1).map(String))).toEqual(
        Array.from({ length: 5 }, () => `#${rebuildFetch}`)
      );
      expect(await grid.fetchCount('ORD')).toBe(rebuildFetch);
      await expect(grid.toast()).toHaveCount(0);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('Row update failed:')]);
      await grid.clearConsoleProblems();
    });

    test('a rebuild drops the fetch of the workbook it replaces', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
      await grid.startFetch();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);

      await grid.setSheets(1);

      expect(await grid.pendingCount('ORD')).toBe(0);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);

      await grid.clickTab(0);

      expect(await grid.pendingCount('ORD')).toBe(1);
      const firstVisitFetch = await grid.fetchCount('ORD');

      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText(`#${firstVisitFetch}`);
    });

    test('enabling the sheets bar on a live grid drops the grid\'s pending fetch', async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ plain: true });
      await grid.startFetch();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);

      await grid.setSheets(1);

      expect(await grid.pendingCount('ORD')).toBe(0);
      expect(await grid.activeSheetIndex()).toBe(1);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('dataProvider')]);
      await grid.clearConsoleProblems();
    });
  });

  test.describe('the visible sheet after an on-screen load', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
    });

    test('a failed save queued behind a landed refetch reverts on screen and shows its toast now', async() => {
      await grid.editCell(0, 1, 'first');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.editCell(1, 1, 'second');
      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText('#2');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);

      await grid.failNextUpdate();
      await grid.releaseUpdates();

      await expect(grid.toast()).toContainText('Could not update rows');
      await expect(grid.cell(1, 1)).toHaveText('#1');
      expect(await grid.pendingCount('ORD')).toBe(0);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('Row update failed:')]);
      await grid.clearConsoleProblems();
    });

    test('a save\'s refetch lands on screen after a sort replaced the rows', async() => {
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.sortByHeader(0, 'desc');
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-25');

      await grid.releaseUpdates();
      await expect.poll(() => grid.pendingCount('ORD')).toBe(1);
      await grid.release('ORD');

      await expect(grid.cell(0, 1)).toHaveText('#3');
      expect(await grid.ids()).toEqual(['ORD-25', 'ORD-24', 'ORD-23', 'ORD-22', 'ORD-21']);
    });
  });

  test.describe('an off-screen fetch failure and the visible sheet', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
    });

    test('leaves a filtered local sheet\'s conditions alone', async() => {
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.clickTab(1);
      await grid.filterColumnByValue(0, ['NOTE-3', 'NOTE-1']);
      const filters = await grid.filterConditions();

      await grid.release('ORD');
      await expect.poll(() => grid.events()).toContain('afterError ORD failed');

      expect(await grid.filterConditions()).toEqual(filters);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-3']);
    });

    test('leaves a filtered server sheet\'s conditions and its loading overlay alone', async() => {
      await grid.clickTab(2);
      await grid.release('CUS');
      await grid.filterColumn(0, 'contains', ['CUS-1']);
      await grid.release('CUS');
      await expect(grid.cell(0, 0)).toHaveText('CUS-10');
      const filters = await grid.filterConditions();

      await grid.clickTab(0);
      await grid.startFetch();
      await grid.failNext('ORD');
      await grid.clickTab(2);
      await grid.startFetch();
      await expect(grid.loadingOverlayVisible()).toBeVisible();

      await grid.release('ORD');
      await expect.poll(() => grid.events()).toContain('afterError ORD failed');

      expect(await grid.filterConditions()).toEqual(filters);
      await expect(grid.loadingOverlayVisible()).toBeVisible();

      await grid.release('CUS');
      await expect(grid.loadingOverlayVisible()).toBeHidden();
      expect(await grid.filterConditions()).toEqual(filters);
    });

    test('a failed fetch after a switch rolls back to the arriving sheet\'s own conditions', async() => {
      await grid.filterColumn(0, 'contains', ['ORD-1']);
      await grid.release('ORD');
      await grid.filterColumn(1, 'contains', ['#']);
      await grid.release('ORD');
      await expect(grid.cell(0, 0)).toHaveText('ORD-10');
      await grid.clickTab(2);
      await grid.release('CUS');
      await expect(grid.cell(0, 0)).toHaveText('CUS-01');

      await grid.failNext('CUS');
      await grid.goToPage(2);
      await grid.release('CUS');

      await expect(grid.toast()).toContainText('Could not load data');
      expect(await grid.filterConditions()).toEqual([]);
    });
  });

  test.describe('sheets with different columns', () => {
    test('a response that lands off-screen restores sort and filters through its own sheet\'s columns', async({
      page, theme, bundle,
    }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto({ invoices: true });
      await grid.clickTab(3);
      await grid.release('INV');
      await expect(grid.cell(0, 1)).toHaveText('INV-01');
      await grid.sortByHeader(1, 'desc');
      await grid.release('INV');
      await grid.filterColumn(1, 'contains', ['INV-1']);
      await grid.release('INV');
      await expect(grid.cell(0, 1)).toHaveText('INV-19');

      await grid.startFetch();
      await grid.clickTab(0);
      await grid.release('INV');
      await grid.clickTab(3);

      await expect(grid.cell(0, 0)).toHaveText('#4');
      expect(await grid.fetchCount('INV')).toBe(4);
      expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
      expect(await grid.filterConditions()).toEqual([expect.objectContaining({ column: 1 })]);
    });
  });

  test.describe('the pager', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
    });

    test('a server sheet fetching for the first time does not show another sheet\'s total', async() => {
      expect((await grid.pagination()).totalPages).toBe(5);

      await grid.clickTab(2);

      expect(await grid.pendingCount('CUS')).toBe(1);
      expect((await grid.pagination()).totalPages).toBe(1);

      await grid.release('CUS');
      await expect.poll(async() => (await grid.pagination()).totalPages).toBe(5);
    });

    test('a server sheet whose first fetch failed off-screen does not show another sheet\'s total', async() => {
      await grid.clickTab(2);
      await grid.failNext('CUS');
      await grid.clickTab(0);
      await grid.release('CUS');
      await expect.poll(() => grid.events()).toContain('afterError CUS failed');

      await grid.clickTab(2);

      await expect(grid.toast()).toContainText('Could not load data');
      expect((await grid.pagination()).totalPages).toBe(1);
    });
  });

  test.describe('work queued for a sheet', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new DataProviderSheetsBarPage(page, theme, bundle);
      await grid.goto();
    });

    test('re-configuring the visible sheet leaves another sheet\'s fetch running', async() => {
      await grid.clickTab(2);
      await grid.clickTab(0);

      await grid.page.evaluate(() => {
        const hot = window.hot as unknown as {
          getSettings(): { dataProvider: object };
          updateSettings(settings: Record<string, unknown>): void;
        };

        hot.updateSettings({ dataProvider: { ...hot.getSettings().dataProvider } });
      });

      expect(await grid.pendingCount('CUS')).toBe(1);
      expect(await grid.pendingCount('ORD')).toBe(1);
      await grid.release('CUS');
      await grid.release('ORD');
      await expect(grid.cell(0, 1)).toHaveText('#2');
      await grid.clickTab(2);

      await expect(grid.cell(0, 0)).toHaveText('CUS-01');
      expect(await grid.fetchCount('CUS')).toBe(1);
    });

    test('a save for a removed sheet does not refetch it', async() => {
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.removeSheet(0);

      await grid.releaseUpdates();
      await expect.poll(() => grid.events()).toContain('afterMutation update');

      expect(await grid.fetchCount('ORD')).toBe(1);
      expect(await grid.pendingCount()).toBe(0);
      expect(await grid.ids()).toEqual(['NOTE-1', 'NOTE-2', 'NOTE-3']);
    });

    test('a failed save for a removed sheet neither reloads it nor shows a toast', async() => {
      await grid.editCell(0, 1, 'edited');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.removeSheet(0);

      await grid.failNextUpdate();
      await grid.releaseUpdates();
      await expect.poll(() => grid.events()).toContain('afterMutationError update');

      expect(await grid.fetchCount('ORD')).toBe(1);
      expect(await grid.pendingCount()).toBe(0);
      await expect(grid.toast()).toHaveCount(0);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('Row update failed:')]);
      await grid.clearConsoleProblems();
    });

    test('a create that fails off-screen shows its toast on return, not before', async() => {
      await grid.startCreateRow('ORD-05');
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.failNextUpdate();
      await grid.releaseUpdates();
      await expect.poll(() => grid.events()).toContain('afterMutationError create');

      await expect(grid.toast()).toHaveCount(0);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('Row create failed:')]);
      await grid.clearConsoleProblems();

      await grid.clickTab(0);

      await expect(grid.toast()).toHaveCount(1);
      await expect(grid.toast()).toContainText('Could not create rows');
      expect(await grid.pendingCount('ORD')).toBe(0);
    });

    test('a remove that fails off-screen shows its toast on return, not before', async() => {
      await grid.startRemoveRows(['ORD-01']);
      await expect.poll(() => grid.pendingUpdateCount()).toBe(1);
      await grid.clickTab(1);
      await grid.failNextUpdate();
      await grid.releaseUpdates();
      await expect.poll(() => grid.events()).toContain('afterMutationError remove');

      await expect(grid.toast()).toHaveCount(0);
      expect(await grid.consoleProblems()).toEqual([expect.stringContaining('Row remove failed:')]);
      await grid.clearConsoleProblems();

      await grid.clickTab(0);

      await expect(grid.toast()).toHaveCount(1);
      await expect(grid.toast()).toContainText('Could not remove rows');
      expect(await grid.ids()).toEqual(['ORD-01', 'ORD-02', 'ORD-03', 'ORD-04', 'ORD-05']);
    });
  });
});
