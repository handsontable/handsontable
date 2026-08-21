import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * The autofill fill handle (`.wtBorder.corner`) against the frozen panes. `.ht_master` declares no
 * z-index, so it opens no stacking context and every border inside it competes directly with the
 * overlay clones. A handle whose z-index reaches the clone range paints over a frozen pane the
 * selection has scrolled under, and wins hit-testing there.
 */
test.describe('fill handle and frozen panes', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  test('keeps the fill handle between the move bands and the frozen panes in the stack', async () => {
    await grid.initGrid({ fixedColumnsStart: 2 });
    await grid.selectCells(4, 3, 6, 5);
    await grid.hoverCell(5, 4);

    // Both the bands and the resize pills are created lazily on the first draw that enables them,
    // so the stack can only be read once they are on the page.
    await expect(grid.visibleHandles()).toHaveCount(4);
    await expect(grid.visibleMoveZones()).toHaveCount(4);

    const stack = await grid.selectionStackOrder();

    // Above the bands, or pressing the handle in the SE corner starts a move drag instead of
    // autofill; below the resize pills, which own the edge midpoints.
    expect(stack.moveZone).toBeLessThan(stack.fillHandle);
    expect(stack.fillHandle).toBeLessThan(stack.resizeHandle);
    // Below the frozen panes, or the handle outranks a clone that is supposed to occlude it.
    expect(stack.fillHandle).toBeLessThan(stack.frozenColumnsPane);
  });

  test('hides the fill handle behind the frozen columns when the cell scrolls under them', async () => {
    await grid.initGrid({ fixedColumnsStart: 2 });
    await grid.selectCells(5, 3, 5, 3);

    await expect(grid.fillHandle()).toBeVisible();
    await grid.scrollCellBehindFrozenPane(5, 3, 'columns');

    // The frozen pane owns those pixels now — asserting on the overlay too, so a handle that simply
    // moved somewhere else cannot pass this as "occluded".
    await expect.poll(() => grid.elementAtFillHandleCenter()).toBe('ht_clone_inline_start/');
  });

  test('lifts the fill handle above the bottom freeze seam so it stays whole', async () => {
    // 10 rows, fixedRowsBottom: 2 → row 7 is the last scrollable row and its bottom edge is the
    // seam. A handle centered there would be cut in half by the bottom overlay, so it is lifted by
    // half its height, exactly like the handle on the grid's own last row.
    await grid.initGrid({ fixedRowsBottom: 2, height: 150 });
    await grid.selectCells(7, 1, 7, 1);

    await expect(grid.fillHandle()).toHaveClass(/wtCornerBlockEndEdge/);
    await expect.poll(() => grid.elementAtFillHandleCenter()).toContain('corner');
  });

  test('hides the fill handle behind the bottom frozen rows when the cell scrolls under them', async () => {
    await grid.initGrid({ fixedRowsBottom: 2, height: 150 });
    await grid.selectCells(3, 1, 3, 1);

    await expect(grid.fillHandle()).toBeVisible();
    await grid.scrollCellBehindFrozenPane(3, 1, 'rows');

    await expect.poll(() => grid.elementAtFillHandleCenter()).toBe('ht_clone_bottom/');
  });
});
