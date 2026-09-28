import { test, expect } from '../fixtures/test';
import { SheetsBarPaginationPage } from '../fixtures/pages/SheetsBarPaginationPage';

/**
 * Pagination keeps one current page for the whole grid and clamps it to the page count on every
 * load. A sheet switch runs a load, so without the page in a sheet's view state a round-trip
 * through a shorter sheet brought the long sheet back on the clamped page, and its restored
 * selection sat on a row hidden by pagination.
 */
test.describe('SheetsBar keeps the pagination state of each sheet', () => {
  let grid: SheetsBarPaginationPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SheetsBarPaginationPage(page, theme, bundle);
    await grid.goto();
  });

  test('the page and the selected cell survive a round-trip through a shorter sheet', async () => {
    await grid.goToPage(7, 20);
    await grid.cell(64, 0).click();
    await expect.poll(() => grid.selectedLast()).toEqual([64, 0, 64, 0]);

    await grid.switchToSheet(1);
    await expect(grid.pageLabel).toHaveText(/ of 2$/);

    await grid.switchToSheet(0);
    await grid.expectPage(7, 20);
    await expect(grid.cell(60, 0)).toHaveText('Long row 61');
    await expect(grid.cell(64, 0)).toBeVisible();
    await expect(grid.cell(64, 0)).toHaveText('Long row 65');
    await expect(grid.cell(64, 0)).toHaveClass(/\bcurrent\b/);
    await expect.poll(() => grid.selectedLast()).toEqual([64, 0, 64, 0]);
  });

  test('a whole row selected from its header survives a round-trip through a shorter sheet', async () => {
    await grid.goToPage(7, 20);
    await grid.rowHeader(65).click();
    await expect.poll(() => grid.selected()).toEqual([[64, -1, 64, 0]]);

    await grid.switchToSheet(1);
    await grid.switchToSheet(0);

    await grid.expectPage(7, 20);
    await expect.poll(() => grid.selected()).toEqual([[64, -1, 64, 0]]);
    await expect.poll(() => grid.isSelectedByRowHeader()).toBe(true);
    await expect(grid.rowHeader(65)).toHaveClass(/\bht__active_highlight\b/);
    await expect(grid.cell(64, 0)).toHaveClass(/\bcurrent\b/);
  });

  test('several rows selected from their headers all come back', async () => {
    await grid.goToPage(7, 20);
    await grid.rowHeader(62).click();
    await grid.rowHeader(65).click({ modifiers: ['ControlOrMeta'] });
    await expect.poll(() => grid.selected()).toEqual([[61, -1, 61, 0], [64, -1, 64, 0]]);

    await grid.switchToSheet(1);
    await grid.switchToSheet(0);

    await grid.expectPage(7, 20);
    await expect.poll(() => grid.selected()).toEqual([[61, -1, 61, 0], [64, -1, 64, 0]]);
  });

  test('each sheet comes back on its own page', async () => {
    await grid.goToPage(7, 20);
    await grid.switchToSheet(1);
    await grid.goToPage(1, 2);

    await grid.switchToSheet(0);
    await grid.expectPage(7, 20);
    await expect(grid.cell(60, 0)).toHaveText('Long row 61');

    await grid.switchToSheet(1);
    await grid.expectPage(1, 2);
    await expect(grid.cell(0, 0)).toHaveText('Short row 1');

    await grid.switchToSheet(0);
    await grid.expectPage(7, 20);
  });

  test('a page size picked in the pagination bar stays with its sheet', async () => {
    await grid.pageSizeSelect.selectOption('20');
    await grid.goToPage(3, 10);
    await expect(grid.cell(40, 0)).toHaveText('Long row 41');

    await grid.switchToSheet(1);
    await grid.pageSizeSelect.selectOption('5');
    await grid.expectPage(1, 3);

    await grid.switchToSheet(0);
    await expect(grid.pageSizeSelect).toHaveValue('20');
    await grid.expectPage(3, 10);
    await expect(grid.cell(40, 0)).toHaveText('Long row 41');

    await grid.switchToSheet(1);
    await expect(grid.pageSizeSelect).toHaveValue('5');
    await grid.expectPage(1, 3);
  });
});
