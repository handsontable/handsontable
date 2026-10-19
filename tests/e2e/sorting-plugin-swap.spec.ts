import { test, expect } from '../fixtures/test';
import { SortingPluginSwapPage } from '../fixtures/pages/SortingPluginSwapPage';

/**
 * `columnSorting` and `multiColumnSorting` refuse to run side by side. An app that switches between
 * them turns one off and the other on in a single `updateSettings` call. That swap has to leave the
 * newly enabled plugin working: a header click sorts, and no conflict warning is logged, because the
 * two plugins are never enabled at the same time.
 */
test.describe('swapping the sorting plugins through `updateSettings`', () => {
  let grid: SortingPluginSwapPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SortingPluginSwapPage(page, theme, bundle);
  });

  test('a header click sorts after switching from `multiColumnSorting` to `columnSorting`', async() => {
    await grid.goto('multi');
    await grid.expectColumn(0, ['Mia', 'Liam', 'Olivia', 'Ethan', 'Ava']);

    await grid.swapTo('column');

    expect(await grid.pluginsState()).toEqual({ columnSorting: true, multiColumnSorting: false });

    await grid.clickHeader(0);

    await expect(grid.sortLabel(0)).toHaveClass(/ascending/);
    await grid.expectColumn(0, ['Ava', 'Ethan', 'Liam', 'Mia', 'Olivia']);
    await grid.expectColumn(1, ['52', '19', '27', '34', '45']);
    expect(grid.sortingWarnings()).toEqual([]);
  });

  test('Enter on a header sorts after switching from `multiColumnSorting` to `columnSorting`', async() => {
    await grid.goto('multi');
    await grid.swapTo('column');

    await grid.pressEnterOnHeader(1);

    await expect(grid.sortLabel(1)).toHaveClass(/ascending/);
    await grid.expectColumn(1, ['19', '27', '34', '45', '52']);
    expect(grid.sortingWarnings()).toEqual([]);
  });

  test('a header click sorts after switching from `columnSorting` to `multiColumnSorting`', async() => {
    await grid.goto('column');
    await grid.expectColumn(1, ['34', '27', '45', '19', '52']);

    await grid.swapTo('multi');

    expect(await grid.pluginsState()).toEqual({ columnSorting: false, multiColumnSorting: true });

    await grid.clickHeader(1);

    await expect(grid.sortLabel(1)).toHaveClass(/ascending/);
    await grid.expectColumn(1, ['19', '27', '34', '45', '52']);
    await grid.expectColumn(0, ['Ethan', 'Liam', 'Mia', 'Olivia', 'Ava']);
    expect(grid.sortingWarnings()).toEqual([]);
  });
});
