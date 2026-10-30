import { test, expect } from '../fixtures/test';
import { ColumnSortingInitLoadPage } from '../fixtures/pages/ColumnSortingInitLoadPage';

/**
 * ColumnSorting applies `initialConfig` from its `afterInit` listener only, so the sort covers whatever
 * data the grid holds when init ends. That includes rows an `init` listener loads after the view
 * exists. These cases pin the sort in both shapes, and pin that the `init`-listener load does not
 * report `initialLoad: true`.
 */
test.describe('ColumnSorting `initialConfig` with a load during init', () => {
  let grid: ColumnSortingInitLoadPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnSortingInitLoadPage(page, theme, bundle);
  });

  test('sorts the data the grid was created with', async() => {
    await grid.goto('none');

    await grid.expectColumn(1, ['9', '27', '34']);
    await grid.expectColumn(0, ['Liam', 'Olivia', 'Mia']);
    expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test('sorts the rows an `init` listener loads', async() => {
    await grid.goto('init');

    await grid.expectColumn(1, ['7', '19', '52', '61']);
    await grid.expectColumn(0, ['Zoe', 'Ethan', 'Ava', 'Noah']);
    expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test('reports `initialLoad: true` only for the load made before the view exists', async() => {
    await grid.goto('init');

    const calls = await grid.loadCalls();

    expect(calls).toHaveLength(2);
    expect(calls.filter(({ initialLoad }) => initialLoad === true)).toEqual([{ initialLoad: true, hasView: false }]);
  });
});
