import { test, expect } from '../fixtures/test';
import { ColumnSortingInitLoadPage } from '../fixtures/pages/ColumnSortingInitLoadPage';

/**
 * ColumnSorting applies `initialConfig` from its `afterInit` listener, so the sort covers whatever
 * data the grid holds when init ends. That includes rows an `init` listener loads after the view
 * exists, which is the one load that could reach the plugin's `afterLoadData` re-sort before
 * `afterInit`. These cases pin the sort in both shapes, and pin that no `afterLoadData` call with
 * a view ever reports `initialLoad: true`.
 */
test.describe('ColumnSorting `initialConfig` with a load during init', () => {
  let grid: ColumnSortingInitLoadPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnSortingInitLoadPage(page, theme, bundle);
  });

  test('sorts the data the grid was created with', async() => {
    await grid.goto('none');

    await grid.expectColumn(1, ['27', '34', '45']);
    await grid.expectColumn(0, ['Liam', 'Mia', 'Olivia']);
    expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test('sorts the rows an `init` listener loads', async() => {
    await grid.goto('init');

    await grid.expectColumn(1, ['19', '40', '52', '61']);
    await grid.expectColumn(0, ['Ethan', 'Zoe', 'Ava', 'Noah']);
    expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test('reports `initialLoad: true` only for the load made before the view exists', async() => {
    await grid.goto('init');

    expect(await grid.loadCalls()).toEqual([
      { initialLoad: true, hasView: false },
      { initialLoad: [null, 'loadData'], hasView: true },
    ]);
  });
});
