import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * The copy-down gesture: a double-click on the fill handle copies the selection into the empty
 * cells below, as far as the neighbouring column is filled. The gesture ends on the second
 * mouseup, and both the fill and the Autofill plugin's drag state have to be settled by then —
 * Walkontable's synthesized double-click and the plugin's own `mouseup` cleanup are driven by the
 * same native event (GitHub #13370).
 */
test.describe('fill handle double-click', () => {
  let grid: SelectionFeaturesPage;

  // Column A filled all the way down, column B filled in rows 0–2 only: the copy-down from B3
  // has an extent (rows 3–7), which is the case that used to leave the drag state armed.
  const DATA = Array.from({ length: 8 }, (_, row) => [
    `A${row + 1}`,
    row < 3 ? `B${row + 1}` : null,
    null,
    null,
  ]);

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
    await grid.initGrid({ data: DATA });
  });

  test('ends the drag state once the double-click fill-down is applied', async () => {
    await grid.selectCells(2, 1, 2, 1);
    await grid.doubleClickFillHandle();

    // The precondition for the bug: the fill-down actually applied.
    await expect(grid.cell(3, 1)).toHaveText('B3');
    await expect(grid.cell(7, 1)).toHaveText('B3');

    // Move around with no button held. A stuck drag state redraws the fill border under the pointer.
    await grid.hoverCell(0, 3);
    await grid.hoverCell(6, 2);

    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });

  // Not a regression test for #13370 (every corner mousedown re-arms the drag state, so it passes
  // on the unfixed code too). It guards the teardown against over-resetting: a fix that tore the
  // drag state down too eagerly would break the very next drag-fill.
  test('keeps the fill handle usable for a drag after a double-click fill-down', async () => {
    await grid.selectCells(2, 1, 2, 1);
    await grid.doubleClickFillHandle();
    await expect(grid.cell(7, 1)).toHaveText('B3');

    await grid.selectCells(0, 0, 0, 0);
    await grid.dragFillHandleTo(0, 2);

    await expect(grid.cell(0, 1)).toHaveText('A1');
    await expect(grid.cell(0, 2)).toHaveText('A1');
    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });
});
