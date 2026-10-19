import { test, expect } from '../fixtures/test';
import { ViewStateApiPage } from '../fixtures/pages/ViewStateApiPage';

/**
 * `ViewState#getViewState()` / `ViewState#setViewState()`: the parts of a view state that need a laid-out
 * grid, restored onto a second grid through JSON. The unit suite covers the other parts.
 */
test.describe('view state API', () => {
  let grid: ViewStateApiPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ViewStateApiPage(page, theme, bundle);
  });

  test('restores the scroll position', async() => {
    await grid.goto();
    await grid.scrollTo('source', 120, 15);

    expect(await grid.copyViewState()).toEqual([]);

    await expect(grid.cell('target', 120, 15)).toBeVisible();
    await expect.poll(() => grid.firstVisible('target')).toEqual({ row: 120, col: 15 });
  });

  test('restores a column selection made from its header', async() => {
    await grid.goto();
    await grid.columnHeader('source', 2).click();

    expect(await grid.copyViewState()).toEqual([]);

    expect(await grid.selected('target')).toEqual(await grid.selected('source'));
    await expect(grid.columnHeader('target', 2)).toHaveClass(/\bht__active_highlight\b/);
  });

  test('restores the page together with a selection on it', async() => {
    await grid.goto({ pagination: true });
    await grid.setPage('source', 3);
    await grid.cell('source', 25, 1).click();

    expect(await grid.copyViewState()).toEqual([]);

    expect(await grid.currentPage('target')).toBe(3);
    expect(await grid.selected('target')).toEqual([[25, 1, 25, 1]]);
    await expect(grid.cell('target', 25, 1)).toHaveClass(/\bcurrent\b/);
  });
});
