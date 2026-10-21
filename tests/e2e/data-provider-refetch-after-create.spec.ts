import { test, expect } from '../fixtures/test';
import { DataProviderRefetchAfterCreatePage } from '../fixtures/pages/DataProviderRefetchAfterCreatePage';

/**
 * DEV-1679: `dataProvider.refetchAfterCreate: false` lets `onRowsCreate` apply the server response
 * itself instead of refetching the current query. The option exists for the sorted grid: a refetch
 * puts the new row wherever the server sorts it, often off the current page, while the manual apply
 * keeps it in front of the user.
 *
 * The fixture follows the documented pattern (`updateData()`, append). The spec drives a real
 * context-menu insert into the middle of a header-sorted grid and checks the three things that
 * pattern has to keep: no refetch, the sort state (indicator and `getSortConfig()`), and cell meta
 * staying on its record. The last one is why the guide appends rather than splices: `updateData()`
 * keeps cell meta by physical row, so a middle splice would move a `readOnly` mark onto the row that
 * took its place.
 */
test.describe('dataProvider.refetchAfterCreate: false on a sorted grid', () => {
  let grid: DataProviderRefetchAfterCreatePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DataProviderRefetchAfterCreatePage(page, theme, bundle);
    await grid.goto();
  });

  test('a context-menu insert keeps the sort, skips the refetch, and shows the applied row', async() => {
    await grid.sortByHeader(1);

    // The sort itself fetched once (initial load + sorted page), and the rows came back sorted.
    expect(await grid.fetchCount()).toBe(2);
    const sortedNames = await grid.namesInOrder();

    expect(sortedNames.slice(0, 3)).toEqual(['Apple', 'Banana', 'Cherry']);

    await grid.insertRowBelowFromContextMenu(3);

    // The applied row is on screen without any further `fetchRows` call.
    await expect(grid.rows).toHaveCount(13);
    expect(await grid.fetchCount()).toBe(2);

    // The sort survived the apply: header indicator and plugin state agree, and the existing rows
    // did not move (`loadData()` would have wiped both).
    await expect(grid.sortLabel(1)).toHaveClass(/ascending/);
    expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);

    const namesAfter = await grid.namesInOrder();

    expect(namesAfter.slice(0, 12)).toEqual(sortedNames);
    expect(namesAfter[12]).toBe('New 1.0');
  });

  test('cell meta stays on its record across the insert', async() => {
    await grid.sortByHeader(1);

    // Mark the record shown at row 5 before the insert; the insert goes in above it (below row 3),
    // which is exactly where a splice-based apply would have shifted the mark onto a different record.
    const markedId = await grid.markReadOnly(5);

    await grid.insertRowBelowFromContextMenu(3);
    await expect(grid.rows).toHaveCount(13);

    expect(await grid.readOnlyRecordIds()).toEqual([markedId]);
    // The new row inherited no meta from anyone.
    await expect(grid.cell(12, 1)).toHaveText('New 1.0');
    await expect(grid.cell(12, 1)).not.toHaveClass(/htDimmed/);
  });
});
