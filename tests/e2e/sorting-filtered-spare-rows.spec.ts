import { test, expect } from '../fixtures/test';
import { SortingFilteredSpareRowsPage, type SortingPlugin } from '../fixtures/pages/SortingFilteredSpareRowsPage';

/**
 * Regression coverage for GH #5983 - sorting a FILTERED grid that has `minSpareRows` set.
 *
 * A filter trims every row failing its conditions, and a spare row is empty, so an ordinary
 * condition trims the spare rows away too. Nothing re-creates them while the filter is on, so
 * the filtered view has no spare rows at all. Sorting nevertheless subtracted `minSpareRows`
 * from the visible row count, which pinned the last N REAL data rows below the sortable range
 * and left them in their pre-sort order - "the sort is off by however many extra blank rows
 * you want added", as the report puts it.
 *
 * The `minSpareRows` rows still have to stay out of the sort whenever they are actually there,
 * which is what the unfiltered cases below pin.
 */
const SORTING_PLUGINS: SortingPlugin[] = ['columnSorting', 'multiColumnSorting'];

// `multiColumnSorting` extends `ColumnSorting` and inherits the range calculation untouched,
// so every case has to hold for both.
for (const plugin of SORTING_PLUGINS) {
  test.describe(`sorting a filtered grid with minSpareRows (${plugin})`, () => {
    let grid: SortingFilteredSpareRowsPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new SortingFilteredSpareRowsPage(page, theme, bundle);
      await grid.goto();
      await grid.useSortingPlugin(plugin);
    });

    test('sorts every visible row once the filter has trimmed the spare row away', async() => {
      // Column D `contains '1'` keeps D1 and D10..D13, and trims the empty spare row with them.
      await grid.applyContainsFilter(3, '1');

      await expect.poll(() => grid.columnValues(0)).toEqual(['A1', 'A10', 'A11', 'A12', 'A13']);
      // The premise of the whole bug: no spare row survives the filter, so nothing may be
      // subtracted from the sortable range.
      await expect.poll(() => grid.trailingEmptyRowCount()).toBe(0);

      await grid.sortByHeader(0);

      await expect.poll(() => grid.columnValues(0)).toEqual(['A1', 'A10', 'A11', 'A12', 'A13']);

      await grid.sortByHeader(0);

      // A13 was the row left behind at the bottom, unsorted, before the fix.
      await expect.poll(() => grid.columnValues(0)).toEqual(['A13', 'A12', 'A11', 'A10', 'A1']);
      await expect(grid.cell(0, 0)).toHaveText('A13');
      await expect(grid.cell(4, 0)).toHaveText('A1');

      expect(grid.pageErrors).toEqual([]);
    });

    test('sorts every visible row when several spare rows were trimmed', async() => {
      // The report describes the offset scaling with the option, so the three-row case is what
      // distinguishes a real fix from one that happens to work for a single row.
      await grid.useSortingPlugin(plugin, { minSpareRows: 3 });
      await grid.applyContainsFilter(3, '1');

      await expect.poll(() => grid.trailingEmptyRowCount()).toBe(0);

      await grid.sortByHeader(0);
      await grid.sortByHeader(0);

      await expect.poll(() => grid.columnValues(0)).toEqual(['A13', 'A12', 'A11', 'A10', 'A1']);

      expect(grid.pageErrors).toEqual([]);
    });

    test('keeps the spare row out of the sort when there is no filter', async() => {
      // The complement of the fix: a spare row that IS present must still stay at the bottom,
      // rather than being sorted in among the data as an empty value.
      //
      // `sortEmptyCells: true` is what makes this assertion able to fail at all. Under the
      // default (`false`) the compare function pushes empty values to the end in BOTH orders, so
      // the spare row lands last whether or not it was inside the sortable range - the test would
      // pass with the spare-row guard deleted. With the option on, an empty value sorts FIRST
      // ascending, so the `null` staying last is evidence of the guard and nothing else.
      await grid.useSortingPlugin(plugin, { [plugin]: { sortEmptyCells: true } });

      await expect.poll(() => grid.trailingEmptyRowCount()).toBe(1);

      await grid.sortByHeader(0);

      // Ascending, sorted as text: `A1` leads, the `A1x` block follows, and the spare row is
      // still the `null` at the end instead of the first row.
      await expect.poll(() => grid.columnValues(0)).toEqual([
        'A1', 'A10', 'A11', 'A12', 'A13', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', null,
      ]);

      expect(grid.pageErrors).toEqual([]);
    });

    test('sorts trailing empty rows that are data rather than spare rows', async() => {
      // The cap, in the direction the bug report does not cover: only `minSpareRows` trailing
      // empty rows are spare, and any beyond that are ordinary data that has to take part in the
      // sort. Three trailing blanks with `minSpareRows: 1` means two of them sort to the top
      // ascending and exactly one stays pinned below the data.
      await grid.useSortingPlugin(plugin, {
        data: [['b'], ['a'], ['c'], [null], [null], [null]],
        colHeaders: true,
        minSpareRows: 1,
        [plugin]: { sortEmptyCells: true },
      });

      await expect.poll(() => grid.trailingEmptyRowCount()).toBe(3);

      await grid.sortByHeader(0);

      await expect.poll(() => grid.columnValues(0)).toEqual([null, null, 'a', 'b', 'c', null]);

      expect(grid.pageErrors).toEqual([]);
    });

    test('restores the spare row below the data when the filter is cleared', async() => {
      // This one's subject is the round trip, not the sortable range: the spare row has to come
      // back below the data once the filter that trimmed it is gone. The guard itself is pinned
      // by the two tests above, which fail without it - a trailing `null` here does not prove it.
      await grid.useSortingPlugin(plugin, { [plugin]: { sortEmptyCells: true } });

      await grid.applyContainsFilter(3, '1');
      await grid.sortByHeader(0);
      await grid.sortByHeader(0);

      await grid.clearFilter();

      // The spare row is back, and it is still the last row - the sort must not have dragged it
      // up among the data while it was trimmed.
      await expect.poll(() => grid.rowCount()).toBe(14);
      await expect.poll(() => grid.trailingEmptyRowCount()).toBe(1);
      await expect.poll(async() => (await grid.columnValues(0)).at(-1)).toBeNull();

      expect(grid.pageErrors).toEqual([]);
    });
  });
}
