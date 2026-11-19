import { test, expect } from '../fixtures/test';
import { CollapsibleEnterVsSortingPage, type SortingPlugin } from '../fixtures/pages/CollapsibleEnterVsSortingPage';

/**
 * Enter on a header that is a collapsible group collapses it, and never sorts, whatever order the two
 * plugins registered their Enter shortcut in. Enter on a plain header still sorts.
 *
 * The order used to be an accident of how a `before` shortcut was inserted, and sorting won as soon as it
 * registered after CollapsibleColumns (a plugin turned off and on again).
 */
for (const sorting of ['columnSorting', 'multiColumnSorting'] as SortingPlugin[]) {
  test.describe(`Enter on a collapsible header with ${sorting}`, () => {
    let grid: CollapsibleEnterVsSortingPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new CollapsibleEnterVsSortingPage(page, theme, bundle, sorting);
      await grid.goto();
    });

    test('collapses a group in the bottom-most header row instead of sorting', async () => {
      await grid.pressEnterOnHeader(-1, 4);

      await expect.poll(() => grid.collapsedColumns()).toEqual([5]);
      await expect(grid.firstRowCells()).toHaveCount(5);
      expect(await grid.sortConfig()).toEqual([]);
    });

    test('expands the group again on the next Enter', async () => {
      await grid.pressEnterOnHeader(-1, 4);
      await expect.poll(() => grid.collapsedColumns()).toEqual([5]);

      await grid.pressEnterOnHeader(-1, 4);

      await expect.poll(() => grid.collapsedColumns()).toEqual([]);
      await expect(grid.firstRowCells()).toHaveCount(6);
      expect(await grid.sortConfig()).toEqual([]);
    });

    test('collapses a group in an upper header row', async () => {
      await grid.pressEnterOnHeader(-2, 1);

      await expect.poll(() => grid.collapsedColumns()).toEqual([2, 3]);
      expect(await grid.sortConfig()).toEqual([]);
    });

    test('still sorts by a header that is not a collapsible group', async () => {
      await grid.pressEnterOnHeader(-1, 0);

      await expect.poll(() => grid.sortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
      expect(await grid.collapsedColumns()).toEqual([]);
    });

    test('still collapses after the sorting plugin registered its shortcut again', async () => {
      await grid.setSorting(false);
      await grid.setSorting(true);
      await grid.pressEnterOnHeader(-1, 4);

      await expect.poll(() => grid.collapsedColumns()).toEqual([5]);
      expect(await grid.sortConfig()).toEqual([]);
    });

    test('still collapses after CollapsibleColumns registered its shortcut again', async () => {
      await grid.setCollapsible(false);
      await grid.setCollapsible(true);
      await grid.pressEnterOnHeader(-1, 4);

      await expect.poll(() => grid.collapsedColumns()).toEqual([5]);
      expect(await grid.sortConfig()).toEqual([]);
    });

    test('still collapses when CollapsibleColumns registered before any sorting shortcut existed', async () => {
      await grid.setSorting(false);
      await grid.setCollapsible(false);
      await grid.setCollapsible(true);
      await grid.setSorting(true);
      await grid.pressEnterOnHeader(-1, 4);

      await expect.poll(() => grid.collapsedColumns()).toEqual([5]);
      expect(await grid.sortConfig()).toEqual([]);
    });
  });
}
