import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * selectionHandles adjust handles (migrated from the frozen Jasmine walkontable
 * suite). The handles are the desktop drag-to-resize pills shown at each edge
 * midpoint of the selection border while the pointer is inside the selection.
 */
test.describe('selectionHandles adjust handles', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  test('shows one handle per edge when hovering inside an interior selection', async () => {
    await grid.selectCells(1, 1, 3, 3);
    await grid.hoverCell(2, 2);

    // Exactly the four edge handles are visible — one per orientation.
    await expect(grid.visibleHandles()).toHaveCount(4);

    for (const edge of ['top', 'bottom', 'start', 'end'] as const) {
      await expect(grid.handle(edge)).toBeVisible();
    }
  });

  test('centers the top and bottom handles on the selection horizontal span', async () => {
    await grid.selectCells(1, 1, 3, 3);
    await grid.hoverCell(2, 2);

    await expect(grid.handle('top')).toBeVisible();

    const range = await grid.rangeBox(1, 1, 3, 3);
    const rangeCenterX = (range.left + range.right) / 2;

    for (const edge of ['top', 'bottom'] as const) {
      const box = await grid.handle(edge).boundingBox();

      expect(box).not.toBeNull();

      // The handle midpoint must land on the selection's horizontal midpoint
      // (±2px for sub-pixel rounding) and strictly inside the selection span.
      const handleCenterX = box!.x + (box!.width / 2);

      expect(Math.abs(handleCenterX - rangeCenterX)).toBeLessThanOrEqual(2);
      expect(box!.x).toBeGreaterThan(range.left);
      expect(box!.x + box!.width).toBeLessThan(range.right);
    }
  });

  test('handles carry orientation classes and no inline visual styling', async () => {
    await grid.selectCells(1, 1, 3, 3);
    await grid.hoverCell(2, 2);

    await expect(grid.handle('top')).toBeVisible();

    // Visual styling (size, background, border-radius, cursor, z-index) is
    // driven entirely by the CSS theme tokens — JS must only set display and
    // position inline. A regression re-introducing inline visuals would
    // override the per-theme tokens.
    const inlineStyles = await grid.handle('top').evaluate(el => ({
      background: el.style.background,
      borderRadius: el.style.borderRadius,
      zIndex: el.style.zIndex,
      cursor: el.style.cursor,
      width: el.style.width,
      height: el.style.height,
      hasBaseClass: el.classList.contains('wtSelectionHandle'),
    }));

    expect(inlineStyles.hasBaseClass).toBe(true);
    expect(inlineStyles.background).toBe('');
    expect(inlineStyles.borderRadius).toBe('');
    expect(inlineStyles.zIndex).toBe('');
    expect(inlineStyles.cursor).toBe('');
    expect(inlineStyles.width).toBe('');
    expect(inlineStyles.height).toBe('');
  });

  test('hides the top handle when the selection top edge is at row 0', async () => {
    await grid.selectCells(0, 1, 2, 3);
    await grid.hoverCell(1, 2);

    // The top edge sits on the grid boundary — there is nothing to resize
    // toward, so its handle is suppressed while the other three stay.
    await expect(grid.handle('bottom')).toBeVisible();
    await expect(grid.handle('start')).toBeVisible();
    await expect(grid.handle('end')).toBeVisible();
    await expect(grid.handle('top')).toBeHidden();
  });

  test('hides end and bottom handles on top and start frozen-pane seams', async () => {
    await grid.initGrid({ fixedRowsTop: 2, fixedColumnsStart: 2 });
    await grid.selectCells(0, 0, 1, 1);
    await grid.hoverFrozenCornerCell(0, 0);

    await expect(grid.handle('bottom')).toBeHidden();
    await expect(grid.handle('end')).toBeHidden();
  });

  test('scrolls and extends the selection while dragging a handle beyond the viewport', async () => {
    await grid.initGrid({ height: 150 });
    await grid.selectCells(1, 1, 2, 2);
    await grid.hoverCell(2, 2);

    const initiallyVisibleBottomRow = await grid.lastFullyVisibleRow();

    await expect(grid.handle('bottom')).toBeVisible();
    await grid.dragBottomHandleBelowViewport();

    await expect.poll(() => grid.firstFullyVisibleRow()).toBeGreaterThan(2);
    await expect.poll(() => grid.selectedBottomRow()).toBeGreaterThan(initiallyVisibleBottomRow + 2);

    await grid.releasePointer();
  });
});
