import { test, expect } from '../fixtures/test';
import { ColumnsLayoutUpdatePage } from '../fixtures/pages/ColumnsLayoutUpdatePage';

const ALL_COLUMNS = ['a', 'b', 'c', 'd'];
const WITHOUT_FIRST = ['b', 'c', 'd'];
const MANUAL_WIDTH = 222;

/**
 * A wrapper sends `data` with every `updateSettings()` call, so a change of its `columns` prop reaches the core as
 * `{ data, columns }`. That payload took the `updateData()` path, which keeps the column index state by physical
 * index: a manual width, a hidden flag, or a sort set on one column then landed on the column that took its place
 * when a column before it was removed. The sort was left half applied, with the indicator on the next column and
 * the rows still ordered by the old one.
 *
 * A changed layout now starts that state over, as `{ columns }` alone does. A layout that did not change, or only
 * gained columns at the end, keeps it.
 */
test.describe('Column state after updateSettings() with data and columns', () => {
  let grid: ColumnsLayoutUpdatePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnsLayoutUpdatePage(page, theme, bundle);
    await grid.goto();
  });

  test('starts with the control state the other tests rely on', async() => {
    // Without this, every "state is gone" assertion below would pass on a state that was never set.
    await grid.resizeColumn(2, MANUAL_WIDTH);
    await grid.hideColumn(1);
    await grid.sortColumn(2);

    expect((await grid.columnWidths())[2]).toBe(MANUAL_WIDTH);
    expect(await grid.hiddenColumns()).toEqual([1]);
    expect(await grid.sortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
  });

  test('does not move a manual width onto the next column when a column before it is removed', async() => {
    await grid.resizeColumn(2, MANUAL_WIDTH);
    await grid.updateColumns(WITHOUT_FIRST);

    await expect(grid.headers()).toHaveText(['B', 'C', 'D']);
    expect(await grid.columnWidths()).not.toContain(MANUAL_WIDTH);
  });

  test('does not hide the next column when a column before the hidden one is removed', async() => {
    await grid.hideColumn(2);
    await expect(grid.headers()).toHaveText(['A', 'B', 'D']);

    await grid.updateColumns(WITHOUT_FIRST);

    expect(await grid.hiddenColumns()).toEqual([]);
    await expect(grid.headers()).toHaveText(['B', 'C', 'D']);
  });

  test('does not leave the sort half applied when a column before the sorted one is removed', async() => {
    await grid.sortColumn(2);
    await expect.poll(() => grid.firstColumnTexts()).toEqual(['a1', 'a2', 'a3']);

    await grid.updateColumns(WITHOUT_FIRST);

    // The indicator and the row order go together: neither is left from the column that was sorted.
    expect(await grid.sortConfig()).toEqual([]);
    await expect.poll(() => grid.firstColumnTexts()).toEqual(['b3', 'b1', 'b2']);
  });

  test('keeps the state when the same columns arrive in new arrays', async() => {
    await grid.resizeColumn(2, MANUAL_WIDTH);
    await grid.hideColumn(1);
    await grid.sortColumn(2);

    await grid.updateColumns(ALL_COLUMNS);
    await grid.updateColumns(ALL_COLUMNS);

    expect((await grid.columnWidths())[2]).toBe(MANUAL_WIDTH);
    expect(await grid.hiddenColumns()).toEqual([1]);
    expect(await grid.sortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
  });

  test('keeps the state when a column is added after the existing ones', async() => {
    await grid.rebuild(['a', 'b', 'c']);
    await grid.resizeColumn(2, MANUAL_WIDTH);
    await grid.hideColumn(1);
    await grid.sortColumn(2);

    await grid.updateColumns(ALL_COLUMNS);

    await expect(grid.headers()).toHaveText(['A', 'C', 'D']);
    expect((await grid.columnWidths())[2]).toBe(MANUAL_WIDTH);
    expect(await grid.hiddenColumns()).toEqual([1]);
    expect(await grid.sortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
  });

  test('keeps the state of the other columns when the last column is removed', async() => {
    await grid.resizeColumn(1, MANUAL_WIDTH);
    await grid.sortColumn(1);
    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);

    await grid.updateColumns(['a', 'b', 'c']);

    await expect(grid.headers()).toHaveText(['A', 'B', 'C']);
    expect((await grid.columnWidths())[1]).toBe(MANUAL_WIDTH);
    expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test('shows the rows a filter trimmed when its column goes away with the conditions', async() => {
    await grid.filterColumn(2, 'c3');
    expect(await grid.rowCount()).toBe(1);
    expect(await grid.filterConditions()).toHaveLength(1);

    await grid.updateColumns(WITHOUT_FIRST);

    // The conditions and the rows they trimmed go together: no hidden rows are left that the UI cannot clear.
    expect(await grid.filterConditions()).toEqual([]);
    expect(await grid.rowCount()).toBe(3);
  });

  test('keeps the filter when the columns do not change', async() => {
    await grid.filterColumn(2, 'c3');

    await grid.updateColumns(ALL_COLUMNS);

    expect(await grid.filterConditions()).toHaveLength(1);
    expect(await grid.rowCount()).toBe(1);
  });
});
