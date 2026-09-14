import { test, expect } from '../fixtures/test';
import { SortingFixedRowsPage, type SortingPlugin } from '../fixtures/pages/SortingFixedRowsPage';

/**
 * Coverage for DEV-59 - the `sortFixedRows` option, which decides whether the rows pinned by
 * `fixedRowsTop` and `fixedRowsBottom` take part in a sort.
 *
 * The default is that they do NOT: that landed in #12627 (DEV-1713) and shipped in 18.0.0,
 * because a footer row holding a SUM over absolute cell addresses was being permuted into the
 * middle of the data. `sortFixedRows: true` puts those rows back inside the sortable range,
 * which is the behavior Handsontable had before 18.0.0.
 *
 * The fixture seeds the pinned rows with column-1 values in the MIDDLE of the range (25 at the
 * top, 35 at the bottom, against 10/20/30/40 in the data rows), so every assertion below is
 * able to fail: under the default the pinned rows stay at row 0 and row 5, and with the option
 * on each drops into the middle of the sorted data. See the fixture comment for why extreme
 * values would have made the descending cases pass either way.
 */
const SORTING_PLUGINS: SortingPlugin[] = ['columnSorting', 'multiColumnSorting'];

/** The whole column sorted ascending when the pinned rows are inside the range. */
const ALL_ROWS_ASC = [10, 20, 25, 30, 35, 40];
/** The whole column sorted descending when the pinned rows are inside the range. */
const ALL_ROWS_DESC = [40, 35, 30, 25, 20, 10];
/** Ascending with row 0 (`Header`, 25) and row 5 (`Total`, 35) held in place. */
const DATA_ROWS_ASC = [25, 10, 20, 30, 40, 35];
/** Descending with row 0 (`Header`, 25) and row 5 (`Total`, 35) held in place. */
const DATA_ROWS_DESC = [25, 40, 30, 20, 10, 35];

// `multiColumnSorting` extends `ColumnSorting` and overrides neither `getNumberOfRowsToSort()`
// nor `sortByPresetSortStates()`, so it inherits both the default and the option - and every
// case here has to hold for both plugins.
for (const plugin of SORTING_PLUGINS) {
  test.describe(`sorting rows pinned by fixedRowsTop / fixedRowsBottom (${plugin})`, () => {
    let grid: SortingFixedRowsPage;

    // Each test builds the grid exactly once, with its own settings. Selecting the plugin here
    // instead would build a grid that every test then throws away.
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new SortingFixedRowsPage(page, theme, bundle);
      await grid.goto();
    });

    test('keeps the pinned rows in place by default', async() => {
      await grid.useSortingPlugin(plugin);

      await grid.sortByHeader(1, 'ascending');

      await expect.poll(() => grid.columnValues(1)).toEqual(DATA_ROWS_ASC);
      await expect.poll(() => grid.columnValues(0))
        .toEqual(['Header', 'Apple', 'Banana', 'Cherry', 'Date', 'Total']);

      // What the user sees: the frozen panes still show the same two rows they showed before
      // the sort, at the same ends of the grid.
      await expect(grid.topOverlayCell(0, 0)).toHaveText('Header');
      await expect(grid.bottomOverlayCell(5, 0)).toHaveText('Total');

      await grid.sortByHeader(1, 'descending');

      await expect.poll(() => grid.columnValues(1)).toEqual(DATA_ROWS_DESC);
      await expect(grid.topOverlayCell(0, 0)).toHaveText('Header');
      await expect(grid.bottomOverlayCell(5, 0)).toHaveText('Total');

      expect(grid.pageErrors).toEqual([]);
    });

    test('sorts the pinned rows with the rest of the data when sortFixedRows is true', async() => {
      await grid.useSortingPlugin(plugin, { [plugin]: { sortFixedRows: true } });

      await grid.sortByHeader(1, 'ascending');

      await expect.poll(() => grid.columnValues(1)).toEqual(ALL_ROWS_ASC);
      // `Header` (25) belongs between 20 and 30, and `Total` (35) between 30 and 40, so both
      // pinned rows end up in the middle of the data.
      await expect.poll(() => grid.columnValues(0))
        .toEqual(['Apple', 'Banana', 'Header', 'Cherry', 'Total', 'Date']);

      // The frozen panes still pin visual rows 0 and 5 - they just hold different rows now.
      await expect(grid.topOverlayCell(0, 0)).toHaveText('Apple');
      await expect(grid.bottomOverlayCell(5, 0)).toHaveText('Date');

      await grid.sortByHeader(1, 'descending');

      await expect.poll(() => grid.columnValues(1)).toEqual(ALL_ROWS_DESC);
      await expect(grid.topOverlayCell(0, 0)).toHaveText('Date');
      await expect(grid.bottomOverlayCell(5, 0)).toHaveText('Apple');

      expect(grid.pageErrors).toEqual([]);
    });

    test('reads sortFixedRows at sort time, so updateSettings changes the next sort', async() => {
      // The option is read from the grid settings on every sort rather than captured when the
      // plugin is enabled. Enabling the plugin with the default and then turning the option on
      // is what proves it: a cached answer would keep the pinned rows out of the second sort.
      await grid.useSortingPlugin(plugin);

      await grid.sortByHeader(1, 'ascending');
      await expect.poll(() => grid.columnValues(1)).toEqual(DATA_ROWS_ASC);

      await grid.setSortFixedRows(true);
      await grid.sortByApi({ column: 1, sortOrder: 'asc' });

      await expect.poll(() => grid.columnValues(1)).toEqual(ALL_ROWS_ASC);

      // And back off again, so the option is not a one-way switch.
      await grid.setSortFixedRows(false);
      await grid.sortByApi({ column: 1, sortOrder: 'asc' });

      await expect.poll(() => grid.columnValues(1)).toEqual(DATA_ROWS_ASC);

      expect(grid.pageErrors).toEqual([]);
    });

    test('honors sortFixedRows for more than one pinned row at each end', async() => {
      // "This feature should work for any defined number of rows", per the ticket. Two pinned
      // rows at each end, with values that interleave with the data, so a fix that only ever
      // handles the first pinned row cannot pass.
      const twoAtEachEnd = {
        data: [
          ['Head1', 25],
          ['Head2', 28],
          ['Banana', 20],
          ['Apple', 10],
          ['Date', 40],
          ['Cherry', 30],
          ['Foot1', 35],
          ['Foot2', 38],
        ],
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      };

      await grid.useSortingPlugin(plugin, twoAtEachEnd);
      await grid.sortByHeader(1, 'ascending');

      // Four pinned rows stay, the four data rows between them sort.
      await expect.poll(() => grid.columnValues(1)).toEqual([25, 28, 10, 20, 30, 40, 35, 38]);

      await grid.useSortingPlugin(plugin, { ...twoAtEachEnd, [plugin]: { sortFixedRows: true } });
      await grid.sortByHeader(1, 'ascending');

      await expect.poll(() => grid.columnValues(1)).toEqual([10, 20, 25, 28, 30, 35, 38, 40]);
      await expect.poll(() => grid.columnValues(0))
        .toEqual(['Apple', 'Banana', 'Head1', 'Head2', 'Cherry', 'Foot1', 'Foot2', 'Date']);

      expect(grid.pageErrors).toEqual([]);
    });

    test('honors sortFixedRows on the maxRows branch of the sortable range', async() => {
      // `getNumberOfRowsToSort()` has a separate early return for `maxRows`, which subtracts
      // `fixedRowsBottom` from `maxRows` instead of from the row count. It is reached when
      // `maxRows` is no larger than the number of rows, so both branches need the option
      // applied - one of them alone leaves the bottom pane pinned.
      await grid.useSortingPlugin(plugin, { maxRows: 6 });
      await expect.poll(() => grid.rowCount()).toBe(6);

      await grid.sortByHeader(1, 'ascending');
      await expect.poll(() => grid.columnValues(1)).toEqual(DATA_ROWS_ASC);

      await grid.useSortingPlugin(plugin, { maxRows: 6, [plugin]: { sortFixedRows: true } });
      await grid.sortByHeader(1, 'ascending');

      await expect.poll(() => grid.columnValues(1)).toEqual(ALL_ROWS_ASC);

      expect(grid.pageErrors).toEqual([]);
    });

    test('keeps the spare row below the data when sortFixedRows is true', async() => {
      // `minSpareRows` reserves trailing empty rows at the bottom independently of
      // `fixedRowsBottom`, and `sortFixedRows` must not disturb that: an empty spare row stays
      // below the data either way. `sortEmptyCells: true` is what lets this fail at all - under
      // the default compare, an empty value is pushed to the end in both orders, so the spare
      // row would land last whether or not it was inside the range.
      const withSpareRow = {
        data: [
          ['Header', 25],
          ['Banana', 20],
          ['Apple', 10],
          ['Date', 40],
          ['Cherry', 30],
          ['Total', 35],
          [null, null],
        ],
        minSpareRows: 1,
      };

      await grid.useSortingPlugin(plugin, {
        ...withSpareRow,
        [plugin]: { sortEmptyCells: true, sortFixedRows: true },
      });

      await grid.sortByHeader(1, 'ascending');

      // The six real rows sort among themselves, pinned rows included, and the spare row is
      // still the trailing `null` rather than the first row.
      await expect.poll(() => grid.columnValues(1)).toEqual([...ALL_ROWS_ASC, null]);

      expect(grid.pageErrors).toEqual([]);
    });
  });
}
