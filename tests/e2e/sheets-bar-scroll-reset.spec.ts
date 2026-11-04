import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarScrollResetPage } from '../fixtures/pages/SheetsBarScrollResetPage';

/**
 * `loadData()` keeps the holder's scroll offset, and a sheet with no view state of its own used to
 * get only its page reset, so a never-visited or newly added sheet opened scrolled to wherever the
 * departing sheet was.
 */
test.describe('SheetsBar opening a sheet with no view state', { tag: THEMES_TAG }, () => {
  let grid: SheetsBarScrollResetPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SheetsBarScrollResetPage(page, theme, bundle);
    await grid.goto();
    await grid.scrollTo(100, 15);
    await expect.poll(() => grid.firstVisible()).toEqual({ row: 100, col: 15 });
  });

  test('a never-visited sheet opens at its first row and column', async () => {
    await grid.switchToSheet(1);

    await expect.poll(() => grid.firstVisible()).toEqual({ row: 0, col: 0 });
    expect(grid.pageErrors).toEqual([]);
  });

  test('a newly added sheet opens at its first row and column', async () => {
    await grid.addAndShowSheet('Added');

    await expect.poll(() => grid.firstVisible()).toEqual({ row: 0, col: 0 });
    expect(grid.pageErrors).toEqual([]);
  });

  test('a return still opens the departing sheet where the user left it', async () => {
    await grid.switchToSheet(1);
    await grid.switchToSheet(0);

    await expect.poll(() => grid.firstVisible()).toEqual({ row: 100, col: 15 });
  });
});
