import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  isListening(): boolean;
}

/**
 * When the focus leaves the document (Tab past the last element goes to the browser UI), no `focusin`
 * lands in the page, so the grid never learns it lost the keyboard. A later Tab brings the focus back
 * onto the grid's focus catcher, and that must select a cell again, as on any other Tab entry (the grid
 * returns to the cell it remembers).
 *
 * The browser UI is out of reach for a test, so the spec drops the selection and the focus to the body
 * instead: it has the same shape (no `focusin`, the grid scope stays active) and the next Tab reaches the
 * same catcher.
 */
test.describe('Tab re-entry after the focus left the page', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: GridPage;

  const getSelected = (page: GridPage['page']) =>
    page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.getSelected());

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridPage(page, theme, bundle);
    await grid.goto();
    await grid.selectCell(2, 1);
    await expect.poll(() => getSelected(grid.page)).toEqual([[2, 1, 2, 1]]);

    // What a Tab past the last cell leaves behind: no selection, the focus gone, the scope still active.
    await page.evaluate(() => {
      (window as Window & { hot: HandsontableFixture & { deselectCell(): void } }).hot.deselectCell();
      (document.activeElement as HTMLElement).blur();
    });
    await expect.poll(() => getSelected(grid.page)).toBeUndefined();

    // Nothing is focused in the page, and the grid did not hear about it.
    await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true);
    await expect.poll(() => page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.isListening()))
      .toBe(true);
  });

  test('Tab selects the remembered cell again', async({ page }) => {
    await page.keyboard.press('Tab');

    await expect.poll(() => getSelected(grid.page)).toEqual([[2, 1, 2, 1]]);

    // The grid has the keyboard: an arrow key moves the selection.
    await page.keyboard.press('ArrowDown');

    await expect.poll(() => getSelected(grid.page)).toEqual([[3, 1, 3, 1]]);
  });

  test('Shift+Tab selects the remembered cell again', async({ page }) => {
    await page.keyboard.press('Shift+Tab');

    await expect.poll(() => getSelected(grid.page)).toEqual([[2, 1, 2, 1]]);

    await page.keyboard.press('ArrowUp');

    await expect.poll(() => getSelected(grid.page)).toEqual([[1, 1, 1, 1]]);
  });
});
