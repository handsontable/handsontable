import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * Disabling the fill handle while it is being held. `updateSettings({ fillHandle: false })` routes
 * the Autofill plugin through `disablePlugin()`, which drops the `mouseup` listener that would
 * normally end the gesture. The drag state has to be torn down on that lifecycle path as well, or
 * the next time the handle is enabled the plugin still believes the pointer is pressed
 * (DEV-2782, the lifecycle twin of GitHub #13370).
 */
test.describe('fill handle disabled mid-drag', () => {
  let grid: SelectionFeaturesPage;

  const DATA = Array.from({ length: 8 }, (_, row) => [`A${row + 1}`, null, null, null]);

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
    await grid.initGrid({ data: DATA });
  });

  test('ends the drag state when the fill handle is disabled between mousedown and mouseup', async () => {
    await grid.selectCells(0, 0, 0, 0);
    await grid.pressFillHandle();

    await grid.setFillHandleEnabled(false);
    await expect(grid.fillHandle()).toHaveCount(0);

    await grid.releasePointer();
    await grid.setFillHandleEnabled(true);
    await expect(grid.fillHandle()).toBeVisible();

    // Move around with no button held. A stuck drag state redraws the fill border under the pointer.
    await grid.hoverCell(3, 2);
    await grid.hoverCell(6, 1);

    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });

  test('keeps the fill handle usable for a drag after it was disabled mid-gesture and re-enabled', async () => {
    await grid.selectCells(0, 0, 0, 0);
    await grid.pressFillHandle();
    await grid.setFillHandleEnabled(false);
    await grid.releasePointer();
    await grid.setFillHandleEnabled(true);

    await grid.selectCells(1, 0, 1, 0);
    await grid.dragFillHandleTo(1, 2);

    await expect(grid.cell(1, 1)).toHaveText('A2');
    await expect(grid.cell(1, 2)).toHaveText('A2');
    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });
});
