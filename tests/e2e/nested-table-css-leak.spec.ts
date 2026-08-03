import { test, expect } from '../fixtures/test';
import { NestedTablePage } from '../fixtures/pages/NestedTablePage';

/**
 * Issue #4363 — Handsontable must not leak its cell styling into a `<table>` a
 * user renders inside a cell, and doing so must not knock the row-header overlay
 * out of alignment with the grid body.
 *
 * Two guarantees, each a real-browser check:
 *  1. Grid cell styling (box-sizing, borders) does not reach the nested table's
 *     cells, while the grid's own cells keep that styling.
 *  2. A tall custom-rendered cell (which auto-expands its row) keeps the
 *     inline-start row-header overlay pixel-aligned with the grid body. This
 *     guards the row-height measurement path: cell CSS is scoped to
 *     `table.htCore`, so the `stylesHandler` box-sizing probe must also be an
 *     `htCore` table or `areCellsBorderBox()` flips and rows mis-measure.
 */
test.describe('nested table in a cell (#4363)', () => {
  let grid: NestedTablePage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new NestedTablePage(page, theme);
    await grid.goto();
  });

  test('grid cell styling does not leak into the nested table', async () => {
    // The nested table never sets `box-sizing`, so a `border-box` reading is the grid's
    // cell rule leaking in. Before the fix this read 'border-box'.
    expect(await grid.computedStyle(grid.nestedCell(), 'box-sizing')).toBe('content-box');
    // The nested table's own box model is fully respected (not overridden by the grid).
    expect(await grid.computedStyle(grid.nestedCell(), 'border-top-width')).toBe('2px');
    expect(await grid.computedStyle(grid.nestedCell(), 'padding')).toBe('6px');
  });

  test('the grid keeps styling its own cells', async () => {
    // The scoping must not be so tight that real grid cells lose their styling.
    const ownCell = grid.cell(1, 0);

    expect(await grid.computedStyle(ownCell, 'box-sizing')).toBe('border-box');
    expect(await grid.computedStyle(ownCell, 'border-bottom-style')).toBe('solid');
  });

  test('row headers stay aligned with an auto-expanded custom-content row', async () => {
    // Row 0 is taller than the default (it holds the nested table), forcing the
    // oversized-row measurement path. The row-header overlay must track it.
    expect(await grid.rowHeaderBottomGap(0)).toBeLessThanOrEqual(1);
    // Rows below the tall one must not accumulate the drift either.
    expect(await grid.rowHeaderBottomGap(1)).toBeLessThanOrEqual(1);
  });
});
