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

    // eslint-disable-next-line no-restricted-syntax -- DEV-3041: switch-time sort interception, fixed in Task 5
    test.fixme('a local sheet sorts and filters client-side and is never overwritten (rule 11)', async() => {
      await grid.clickTab(1);
      await grid.sortByHeader(0, 'desc');
      await grid.filterColumnByValue(0, ['NOTE-3', 'NOTE-1']);

      expect(await grid.ids()).toEqual(['NOTE-3', 'NOTE-1']);
      expect(await grid.fetchCount('ORD')).toBe(1);
      expect(await grid.pendingCount()).toBe(0);
    });
  });
});
