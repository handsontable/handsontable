import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * A selection dragged with the real mouse on the shared `/` grid spans from the cell the drag starts in
 * to the cell it is released over, with the focus left on the first. `mouseInteraction/selection.spec.js`
 * asserts the classes a range gets with simulated events; the real drag on this grid was the
 * `select-few-cells-by-mouse` visual spec's one capture, taken with nothing asserted, on every js variant
 * and the three wrappers. The range's look is painted on every js variant by the selection-handles
 * capture, so DEV-3351 retired that spec and asserts the drag here.
 */
test.describe('a selection dragged with the mouse', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('spans from the cell the drag starts in to the cell it ends over', async() => {
    // The visual spec's drag: 100 px right and down from the middle of cell (1, 0).
    const end = await grid.dragSelectFrom(1, 0, 100);

    // A drag that ended in the cell it started in would prove nothing about the range.
    expect(end.row).toBeGreaterThan(1);
    expect(end.column).toBeGreaterThan(0);
    expect(await grid.selected()).toEqual([[1, 0, end.row, end.column]]);

    const drawn = await grid.drawnSelection();

    expect(drawn.current).toEqual(['cell-1-0']);
    // Every cell of the range but the focused one is drawn as part of the area.
    await expect(grid.cell(end.row, end.column)).toHaveClass(/\barea\b/);
  });
});
