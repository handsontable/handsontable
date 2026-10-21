import { test, expect } from '../fixtures/test';
import { HiddenRowsFixedBottomPage } from '../fixtures/pages/HiddenRowsFixedBottomPage';

/**
 * Hiding the last scrollable row (the one right above the `fixedRowsBottom` band) moves the
 * selection onto a row of that band. The selection hooks run before the bottom overlay redraws, so
 * a synchronous `getCell()` there throws "TR was expected to be rendered but is not". The grid's
 * focus handling did exactly that until it started to focus the cell after the render instead.
 *
 * Each case scrolls to the bottom first, so the hidden row is the last one rendered above the band,
 * and hides through the row header context menu, the only way a user reaches the item. After the
 * hide, the selection is the first band row and the focus must land on its first cell in the bottom
 * overlay, which only a redraw of that overlay can provide.
 */
test.describe('Hiding the row next to the fixedRowsBottom band', () => {
  let grid: HiddenRowsFixedBottomPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new HiddenRowsFixedBottomPage(page, theme, bundle);

    await grid.goto();
    await grid.scrollToBottom();
  });

  /**
   * The state every case ends in: the first band row selected, its header marked active by the
   * bottom overlay's redraw, and the focus on that row's first cell in the bottom overlay.
   */
  async function expectSelectionMovedIntoTheBand(): Promise<void> {
    expect(await grid.selectedRow()).toEqual({ row: 48, isHidden: false });
    await expect(grid.bottomBandRowHeader(48)).toHaveClass(/\bht__active_highlight\b/);
    await expect.poll(() => grid.focusedCell()).toEqual({ row: 48, col: 0, inBottomBand: true });
  }

  test('"Hide row" on the last row above the band hides it without throwing', async() => {
    await grid.hideRowsFromHeaderMenu(47);

    expect(grid.pageErrors).toEqual([]);
    await expect(grid.menu).toBeHidden();
    expect(await grid.hiddenRows()).toEqual([47]);
    await expect(grid.rowHeader(47)).toBeHidden();
    await expect(grid.rowHeader(46)).toBeVisible();
    await expectSelectionMovedIntoTheBand();
    expect(grid.pageErrors).toEqual([]);
  });

  test('"Hide rows" on the two rows above the band hides both without throwing', async() => {
    await grid.hideRowsFromHeaderMenu(46, 47);

    expect(grid.pageErrors).toEqual([]);
    await expect(grid.menu).toBeHidden();
    expect(await grid.hiddenRows()).toEqual([46, 47]);
    await expect(grid.rowHeader(45)).toBeVisible();
    await expectSelectionMovedIntoTheBand();
    expect(grid.pageErrors).toEqual([]);
  });
});
