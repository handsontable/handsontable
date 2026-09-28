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

    // Drag one cell first, so the fill border is actually painted when the plugin is disabled. That
    // is the damaging half of the bug: the old code left the dashed border on screen as well as the
    // gesture armed, and a disable that never drew one cannot tell the two teardowns apart.
    await grid.dragPointerToCell(2, 0);
    await expect(grid.visibleFillBorders()).not.toHaveCount(0);

    await grid.setFillHandleEnabled(false);
    await expect(grid.fillHandle()).toHaveCount(0);
    await expect(grid.visibleFillBorders()).toHaveCount(0);

    await grid.releasePointer();
    await grid.setFillHandleEnabled(true);
    await expect(grid.fillHandle()).toBeVisible();

    // Move around with no button held. A stuck drag state redraws the fill border under the pointer.
    await grid.hoverCell(3, 2);
    await grid.hoverCell(6, 1);

    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });

  // Not a regression test for DEV-2782 (every corner mousedown re-arms the drag state, so it passes
  // on the unfixed code too). It guards the teardown against over-resetting: a fix that tore down
  // more than the gesture owns would break the very next drag-fill.
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

  // The other half of the teardown rule. `updateSettings` reaches the plugin whenever `fillHandle` is
  // merely present in the payload, unchanged value included, and the React wrapper re-sends every
  // declared prop on every re-render. That routes through `updatePlugin()`, which disables and
  // re-enables the plugin in the same tick, so the gesture it belongs to has to survive.
  test('keeps a drag alive when updateSettings re-sends the same fillHandle value mid-drag', async () => {
    await grid.selectCells(0, 0, 0, 0);
    await grid.pressFillHandle();
    await grid.dragPointerToCell(2, 0);

    await grid.resendFillHandleSetting();

    await grid.dragPointerToCell(3, 0);
    await grid.releasePointer();

    // The drag was never interrupted, so the fill commits over the whole dragged extent.
    await expect(grid.cell(2, 0)).toHaveText('A1');
    await expect(grid.cell(3, 0)).toHaveText('A1');
    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });

  // The limit of the carve-out above. A reconfiguration that genuinely changes what a fill may do
  // still has to end the gesture, or the drag commits under the rules it was drawn with.
  test('ends the drag when updateSettings narrows the allowed direction mid-drag', async () => {
    await grid.selectCells(0, 0, 0, 0);
    await grid.pressFillHandle();
    await grid.dragPointerToCell(2, 0);

    await grid.setFillHandleDirection('horizontal');

    await grid.releasePointer();

    // The vertical drag is abandoned rather than committed against the now horizontal-only setting.
    await expect(grid.cell(1, 0)).toHaveText('A2');
    await expect(grid.cell(2, 0)).toHaveText('A3');
    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });
});
