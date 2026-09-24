import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * selectionHandles adjust handles (migrated from the frozen Jasmine walkontable
 * suite). The handles are the desktop drag-to-resize pills shown at each edge
 * midpoint of the selection border while the pointer is inside the selection.
 */
test.describe('selectionHandles adjust handles', () => {
  let grid: SelectionFeaturesPage;

  /**
   * A viewport big enough that every row and column a resize test drags to is fully rendered in all
   * three themes. The fixture's 500x400 default only renders roughly the first six columns, and cell
   * sizes differ per theme — so a drag toward column 8 either never finds its target (horizon) or
   * triggers horizontal auto-scroll and over-extends the selection by a column (classic).
   */
  const ROOMY_VIEWPORT = { width: 900, height: 520 };

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  test('hides the handles while a cell editor is open', async () => {
    await grid.selectCells(1, 1, 3, 3);
    await grid.hoverCell(2, 2);

    await expect(grid.visibleHandles()).toHaveCount(4);

    // Resizing mid-edit would swallow the mousedown that normally commits the editor — the handles
    // must not render (matching the fill-handle corner, which also hides while an editor is open).
    await grid.openEditor();

    await expect(grid.visibleHandles()).toHaveCount(0);

    await grid.closeEditor();
    await grid.hoverCell(2, 2);

    await expect(grid.visibleHandles()).toHaveCount(4);
  });

  test('hides the handles when the plugin is disabled at runtime', async () => {
    await grid.selectCells(1, 1, 3, 3);
    await grid.hoverCell(2, 2);

    await expect(grid.visibleHandles()).toHaveCount(4);

    // `disablePlugin()` must win over the still-`true` setting.
    await grid.setPluginEnabled('selectionHandles', false);

    await expect(grid.visibleHandles()).toHaveCount(0);

    await grid.setPluginEnabled('selectionHandles', true);
    // The pointer still rests on (2, 2) from the earlier hover, so hovering it again fires no
    // fresh `mouseover` — leave the selection first so re-entering it re-arms the hover wiring.
    await grid.hoverCell(0, 0);
    await grid.hoverCell(2, 2);

    await expect(grid.visibleHandles()).toHaveCount(4);
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

  test('hides the top handle when the selection starts on the bottom frozen-pane seam', async () => {
    // 10 rows, fixedRowsBottom: 2 → the seam runs between rows 7 and 8. A selection starting at
    // row 8 (inside the bottom pane) has its top edge ON the seam — the top handle must be
    // suppressed there, exactly like the mirrored cases on the fixedRowsTop seam.
    await grid.initGrid({ fixedRowsBottom: 2 });
    await grid.selectCells(8, 1, 8, 2);
    await grid.hoverFrozenBottomCell(8, 1);

    await expect(grid.frozenBottomHandle('top')).toBeHidden();
    // Row 8 is neither the seam nor the grid boundary from below, so the bottom handle stays.
    await expect(grid.frozenBottomHandle('bottom')).toBeVisible();
    await expect(grid.frozenBottomHandle('start')).toBeVisible();
    await expect(grid.frozenBottomHandle('end')).toBeVisible();
  });

  test('hides the bottom handle when the selection ends on the bottom frozen-pane seam', async () => {
    // The already-covered mirror: a selection ending at row 7 (last non-frozen row) has its
    // bottom edge on the seam.
    await grid.initGrid({ fixedRowsBottom: 2 });
    await grid.selectCells(6, 1, 7, 2);
    await grid.hoverCell(6, 1);

    await expect(grid.handle('bottom')).toBeHidden();
    await expect(grid.handle('top')).toBeVisible();
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

  test('preserves fixed edges when resizing reverse-direction selections', async () => {
    const selections = [
      [1, 1, 3, 3],
      [1, 3, 3, 1],
      [3, 1, 1, 3],
      [3, 3, 1, 1],
    ];
    const resizeCases = [
      { edge: 'top', row: 0, col: 2, expected: { top: 0, start: 1, bottom: 3, end: 3 } },
      { edge: 'bottom', row: 5, col: 2, expected: { top: 1, start: 1, bottom: 5, end: 3 } },
      { edge: 'start', row: 2, col: 0, expected: { top: 1, start: 0, bottom: 3, end: 3 } },
      { edge: 'end', row: 2, col: 5, expected: { top: 1, start: 1, bottom: 3, end: 5 } },
    ] as const;

    for (const selection of selections) {
      for (const { edge, row, col, expected } of resizeCases) {
        await grid.initGrid();
        await grid.selectCells(selection[0], selection[1], selection[2], selection[3]);
        await grid.hoverCell(2, 2);
        await grid.dragHandleToCell(edge, row, col);

        expect(await grid.selectedBounds()).toEqual(expected);
      }
    }
  });

  test('cleans up an active handle drag when the grid is destroyed', async ({ page }) => {
    await grid.selectCells(1, 1, 3, 3);
    await grid.hoverCell(2, 2);
    await expect(grid.handle('bottom')).toBeVisible();

    await grid.pressBottomHandle();

    await expect(grid.resizingRoot()).toHaveCount(1);
    await expect(page.locator('body')).toHaveCSS('cursor', 'ns-resize');

    await grid.destroyGrid();

    await expect(grid.resizingRoot()).toHaveCount(0);
    await expect(page.locator('body')).toHaveCSS('cursor', 'auto');
    await grid.releasePointer();
  });

  test('hides the handles when the pointer leaves the selected range', async () => {
    await grid.selectCells(2, 2, 5, 5);
    await grid.hoverCell(3, 3);

    await expect(grid.visibleHandles()).toHaveCount(4);

    await grid.hoverCell(0, 0);

    await expect(grid.visibleHandles()).toHaveCount(0);
  });

  test('shows no handles when selectionHandles is disabled', async () => {
    await grid.initGrid({ selectionHandles: false });
    await grid.selectCells(2, 2, 5, 5);
    await grid.hoverCell(3, 3);

    await expect(grid.visibleHandles()).toHaveCount(0);
  });

  test('shows the handles right after a drag-select ends inside the selection', async () => {
    // No fresh `mouseover` fires after the `mouseup`, which is exactly when the handles used to stay
    // hidden until the pointer moved again.
    await grid.dragSelectCells(2, 2, 4, 4);

    await expect(grid.visibleHandles()).toHaveCount(4);
  });

  test('shows no handles when selectionMode is single', async () => {
    await grid.initGrid({ selectionMode: 'single' });
    await grid.selectCells(2, 2, 2, 2);
    await grid.hoverCell(2, 2);

    await expect(grid.visibleHandles()).toHaveCount(0);
  });

  test('shows no handles when entire columns are selected', async () => {
    await grid.selectColumns(2, 4);
    await grid.hoverCell(2, 3);

    await expect(grid.visibleHandles()).toHaveCount(0);
  });

  test('hides the non-dragged handles while resizing and holds the resize cursor', async () => {
    await grid.selectCells(2, 2, 5, 5);
    await grid.hoverCell(3, 3);

    await grid.startHandleDragOverCell('bottom', 8, 5);

    // Only the dragged edge stays visible; the root's `ht__resizing-selection--bottom` class hides
    // the rest for the duration of the drag.
    await expect(grid.handle('bottom')).toBeVisible();
    await expect(grid.handle('top')).toHaveCount(0);
    await expect(grid.handle('start')).toHaveCount(0);
    await expect(grid.handle('end')).toHaveCount(0);
    // Bottom handle drives the row axis, so the cursor is the vertical resize one.
    expect(await grid.bodyCursor()).toBe('ns-resize');

    await grid.releasePointer();
  });

  test('grows the selection downward without changing the column span', async () => {
    await grid.initGrid(ROOMY_VIEWPORT);
    await grid.selectCells(2, 2, 4, 4);
    await grid.hoverCell(3, 3);

    // Target column 7 differs from the selection's 2..4: the bottom handle must ignore horizontal
    // pointer movement and only move the row axis.
    await grid.dragHandleToCell('bottom', 7, 7);

    expect(await grid.selectedBounds()).toEqual({ top: 2, start: 2, bottom: 7, end: 4 });
  });

  test('clamps the top handle at the bottom edge instead of flipping the selection', async () => {
    await grid.initGrid(ROOMY_VIEWPORT);
    await grid.selectCells(2, 2, 5, 5);
    await grid.hoverCell(3, 3);

    // Row 9 is below the bottom edge (row 5) — the range must collapse onto the anchor row, not
    // invert through it.
    await grid.dragHandleToCell('top', 9, 3);

    const bounds = await grid.selectedBounds();

    expect(bounds.top).toBe(5);
    expect(bounds.bottom).toBe(5);
  });

  test('moves only the start edge, keeping the end edge anchored', async () => {
    await grid.initGrid(ROOMY_VIEWPORT);
    await grid.selectCells(2, 3, 5, 6);
    await grid.hoverCell(3, 4);

    // Target row 8 differs from the selection's 2..5: a start handle must ignore vertical movement.
    await grid.dragHandleToCell('start', 8, 1);

    expect(await grid.selectedBounds()).toEqual({ top: 2, start: 1, bottom: 5, end: 6 });
  });

  test('moves only the end edge, keeping the start edge anchored', async () => {
    await grid.initGrid(ROOMY_VIEWPORT);
    await grid.selectCells(2, 3, 5, 6);
    await grid.hoverCell(3, 4);

    await grid.dragHandleToCell('end', 9, 8);

    expect(await grid.selectedBounds()).toEqual({ top: 2, start: 3, bottom: 5, end: 8 });
  });

  test('expands to the full merged block when the bottom handle is dragged into a merge', async () => {
    await grid.initGrid({ mergeCells: [{ row: 5, col: 2, rowspan: 2, colspan: 2 }] });
    await grid.selectCells(2, 2, 4, 3);
    await grid.hoverCell(3, 2);

    // The merge spans rows 5..6, so dropping on it must still take in row 6 — a merged block may not
    // be left visually split. Target (5, 2) because a merged region renders only its top-left TD, so
    // that is the cell carrying a test id.
    await grid.dragHandleToCell('bottom', 5, 2);

    const bounds = await grid.selectedBounds();

    expect(bounds.top).toBe(2);
    expect(bounds.bottom).toBeGreaterThanOrEqual(6);
    expect(bounds.start).toBe(2);
    expect(bounds.end).toBe(3);
  });

  test('resizes correctly when dragging the bottom handle in an RTL layout', async () => {
    await grid.initGrid({ ...ROOMY_VIEWPORT, layoutDirection: 'rtl' });
    await grid.selectCells(2, 2, 4, 4);
    await grid.hoverCell(3, 3);

    await grid.dragHandleToCell('bottom', 7, 6);

    // RTL mirrors the inline axis visually, but the row axis and the reported column span must be
    // unaffected.
    expect(await grid.selectedBounds()).toEqual({ top: 2, start: 2, bottom: 7, end: 4 });
  });

  test('preserves the other layer when resizing the hovered last layer', async () => {
    await grid.initGrid(ROOMY_VIEWPORT);
    await grid.selectLayers([[2, 1, 6, 1], [2, 3, 7, 3]]);
    await grid.hoverCell(4, 3);

    await grid.dragHandleToCell('bottom', 9, 3);

    const layers = await grid.allSelectedBounds();

    expect(layers).toHaveLength(2);
    expect(layers[0]).toEqual({ top: 2, start: 1, bottom: 6, end: 1 });
    expect(layers[1]).toEqual({ top: 2, start: 3, bottom: 9, end: 3 });
  });

  test('preserves the other layer when resizing a non-last layer', async () => {
    await grid.initGrid(ROOMY_VIEWPORT);
    await grid.selectLayers([[2, 1, 6, 1], [2, 3, 7, 3]]);
    await grid.hoverCell(4, 1);

    await grid.dragHandleToCell('bottom', 9, 1);

    const layers = await grid.allSelectedBounds();

    expect(layers).toHaveLength(2);
    expect(layers[0]).toEqual({ top: 2, start: 1, bottom: 9, end: 1 });
    // The layer that was not hovered must come through untouched.
    expect(layers[1]).toEqual({ top: 2, start: 3, bottom: 7, end: 3 });
  });

  test('keeps the focus cell stable when growing the selection via the top handle', async () => {
    await grid.selectCells(2, 2, 5, 5);

    expect(await grid.focusCell()).toEqual({ row: 2, col: 2 });

    await grid.hoverCell(3, 3);
    await grid.dragHandleToCell('top', 0, 3);

    // The focus stays where it was — it must not jump to the anchor corner just because the range grew.
    expect(await grid.focusCell()).toEqual({ row: 2, col: 2 });
  });

  test('keeps the focus cell stable when growing the selection via the end handle', async () => {
    await grid.initGrid(ROOMY_VIEWPORT);
    await grid.selectCells(2, 2, 5, 5);
    await grid.hoverCell(3, 3);

    await grid.dragHandleToCell('end', 3, 8);

    expect(await grid.focusCell()).toEqual({ row: 2, col: 2 });
  });

  test('clamps the focus into the range when the top handle shrinks past it', async () => {
    await grid.selectCells(2, 2, 5, 5);
    await grid.hoverCell(3, 3);

    // New range is rows 4..5; the focus row 2 falls outside and must clamp to the new top edge.
    await grid.dragHandleToCell('top', 4, 3);

    expect(await grid.focusCell()).toEqual({ row: 4, col: 2 });
  });

  test('clamps the focus into the range when the bottom handle shrinks past it', async () => {
    // Reversed range puts the focus on the bottom row (5, 2) of the normalized 2..5 range.
    await grid.selectCells(5, 2, 2, 5);

    expect(await grid.focusCell()).toEqual({ row: 5, col: 2 });

    await grid.hoverCell(3, 3);
    await grid.dragHandleToCell('bottom', 3, 3);

    expect(await grid.focusCell()).toEqual({ row: 3, col: 2 });
  });

  test('clamps the focus into the range when the start handle shrinks past it', async () => {
    await grid.selectCells(2, 2, 5, 5);
    await grid.hoverCell(3, 3);

    // New range is cols 4..5; the focus col 2 falls outside and must clamp to the new start edge.
    await grid.dragHandleToCell('start', 3, 4);

    expect(await grid.focusCell()).toEqual({ row: 2, col: 4 });
  });

  test('does not start a resize drag on a right-press', async () => {
    await grid.selectCells(2, 2, 5, 5);
    await grid.hoverCell(3, 3);
    await expect(grid.handle('bottom')).toBeVisible();

    await grid.rightPressHandle('bottom');

    // This pins the guard in SelectionHandles' own `afterOnSelectionHandleMouseDown` listener. The
    // matching guard in the Walkontable border's handle mousedown listener is defense-in-depth and is
    // NOT covered here — with it removed, the plugin guard alone still keeps this assertion green.
    expect(await grid.isHandleDragActive()).toBe(false);
    await expect(grid.resizingRoot()).toHaveCount(0);

    await grid.releasePointer();

    expect(await grid.selectedBounds()).toEqual({ top: 2, start: 2, bottom: 5, end: 5 });
  });

  test.describe('a selection crossing a frozen pane', () => {
    /**
     * The center of a located element's box.
     */
    async function centerOf(locator: ReturnType<SelectionFeaturesPage['handle']>) {
      const box = await locator.boundingBox();

      expect(box).not.toBeNull();

      return { x: box!.x + (box!.width / 2), y: box!.y + (box!.height / 2) };
    }

    test('draws each handle once, on the outer edge, across frozen columns', async () => {
      await grid.initGrid({ ...ROOMY_VIEWPORT, fixedColumnsStart: 1 });
      await grid.selectCells(4, 0, 8, 3);
      await grid.hoverCell(6, 2);

      // Column 0 is the grid boundary, so there is no start handle. Before the fix the frozen-columns
      // overlay drew its own top, bottom and end handles on its slice (column 0): six in total, with an
      // end handle on the freeze line in the middle of the selection.
      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(3);
      await expect(grid.handleInAnyOverlay('start')).toHaveCount(0);

      const seamBox = await grid.frozenColumnCell(6, 0).boundingBox();
      const range = await grid.rangeBox(4, 0, 8, 3);
      const seamX = seamBox!.x + seamBox!.width;

      const end = await centerOf(grid.handleInAnyOverlay('end'));

      expect(Math.abs(end.x - range.right)).toBeLessThanOrEqual(2);

      for (const edge of ['top', 'bottom'] as const) {
        const box = await grid.handleInAnyOverlay(edge).boundingBox();

        // Centered on the scrollable part of the selection: fully past the freeze line, inside the span.
        expect(box!.x).toBeGreaterThan(seamX + 2);
        expect(box!.x + box!.width).toBeLessThan(range.right);
      }
    });

    test('draws each handle once, on the outer edge, across frozen rows', async () => {
      await grid.initGrid({ ...ROOMY_VIEWPORT, fixedRowsTop: 2 });
      await grid.selectCells(1, 1, 5, 3);
      await grid.hoverCell(3, 2);

      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(4);

      for (const edge of ['top', 'bottom', 'start', 'end'] as const) {
        await expect(grid.handleInAnyOverlay(edge)).toHaveCount(1);
      }

      const seamBox = await grid.frozenRowCell(1, 1).boundingBox();
      const range = await grid.rangeBox(1, 1, 5, 3);
      const seamY = seamBox!.y + seamBox!.height;
      const top = await centerOf(grid.handleInAnyOverlay('top'));

      expect(Math.abs(top.y - range.top)).toBeLessThanOrEqual(2);

      for (const edge of ['start', 'end'] as const) {
        const box = await grid.handleInAnyOverlay(edge).boundingBox();

        expect(box!.y).toBeGreaterThan(seamY + 2);
        expect(box!.y + box!.height).toBeLessThan(range.bottom);
      }
    });

    test('draws each handle once across frozen rows and columns at the same time', async () => {
      await grid.initGrid({ ...ROOMY_VIEWPORT, fixedRowsTop: 2, fixedColumnsStart: 1 });
      await grid.selectCells(1, 0, 5, 3);
      await grid.hoverCell(3, 2);

      // Four overlays draw a slice of this selection; before the fix each carried three handles.
      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(3);

      for (const edge of ['top', 'bottom', 'end'] as const) {
        await expect(grid.handleInAnyOverlay(edge)).toHaveCount(1);
      }
    });

    test('draws each handle once across the bottom frozen rows', async () => {
      // 10 rows, fixedRowsBottom: 2 → rows 8 and 9 are frozen. The selection ends on row 8, so its
      // bottom edge is neither on the seam nor on the grid boundary.
      await grid.initGrid({ ...ROOMY_VIEWPORT, fixedRowsBottom: 2 });
      await grid.selectCells(5, 1, 8, 3);
      await grid.hoverCell(6, 2);

      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(4);

      for (const edge of ['top', 'bottom', 'start', 'end'] as const) {
        await expect(grid.handleInAnyOverlay(edge)).toHaveCount(1);
      }

      // The bottom edge belongs to the bottom frozen pane.
      await expect(grid.frozenBottomHandle('bottom')).toHaveCount(1);
    });

    test('keeps the top and bottom handles on the frozen part once the scrollable part scrolls away', async () => {
      await grid.initGrid({
        ...ROOMY_VIEWPORT,
        data: Array.from({ length: 10 }, (_, r) => Array.from({ length: 40 }, (__, c) => `R${r + 1}C${c + 1}`)),
        fixedColumnsStart: 1,
      });
      await grid.selectCells(4, 0, 8, 1);
      await grid.scrollToColumn(39);
      await grid.frozenColumnCell(6, 0).hover();

      // Column 1 is no longer rendered, so the frozen-columns overlay takes the top and bottom handles
      // over. The end handle's edge is scrolled out of view, so nothing draws it.
      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(2);
      await expect(grid.handleInAnyOverlay('top')).toHaveCount(1);
      await expect(grid.handleInAnyOverlay('bottom')).toHaveCount(1);

      await grid.scrollToColumn(1);
      await grid.hoverCell(6, 1);

      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(3);

      for (const edge of ['top', 'bottom', 'end'] as const) {
        await expect(grid.handleInAnyOverlay(edge)).toHaveCount(1);
      }
    });

    for (const renderAllColumns of [false, true]) {
      test(`moves the top and bottom handles to the frozen part when the scrollable part is rendered but hidden (renderAllColumns: ${renderAllColumns})`, async () => {
        await grid.initGrid({
          ...ROOMY_VIEWPORT,
          data: Array.from({ length: 10 }, (_, r) => Array.from({ length: 40 }, (__, c) => `R${r + 1}C${c + 1}`)),
          fixedColumnsStart: 1,
          renderAllColumns,
        });
        await grid.selectCells(4, 0, 8, 1);
        // Column 2 lands right after the frozen column, so column 1 stays rendered (the rendering
        // offset, or every column with renderAllColumns) while the frozen pane covers it.
        await grid.scrollToColumn(2);
        await grid.frozenColumnCell(6, 0).hover();

        await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(2);

        const { cell, handles } = await grid.handleBoxesAgainstCell('ht_clone_inline_start', 6, 0);

        expect(handles.end).toHaveLength(0);

        for (const edge of ['top', 'bottom'] as const) {
          expect(handles[edge]).toHaveLength(1);

          const handleCenterX = handles[edge][0].x + (handles[edge][0].width / 2);

          // Over the frozen column, where the user can see the selection's edge.
          expect(handleCenterX).toBeGreaterThan(cell.x);
          expect(handleCenterX).toBeLessThan(cell.x + cell.width);
        }
      });
    }

    test('moves the start and end handles to the frozen rows when the scrollable rows are rendered but hidden', async () => {
      await grid.initGrid({
        ...ROOMY_VIEWPORT,
        data: Array.from({ length: 40 }, (_, r) => Array.from({ length: 10 }, (__, c) => `R${r + 1}C${c + 1}`)),
        fixedRowsTop: 2,
      });
      await grid.selectCells(1, 1, 5, 3);
      // Row 6 lands right below the frozen rows, so the rendering offset keeps row 5 rendered while
      // the frozen pane covers it.
      await grid.scrollToRow(6);
      await grid.frozenRowCell(1, 2).hover();

      const { cell, handles } = await grid.handleBoxesAgainstCell('ht_clone_top', 1, 2);

      // The bottom edge (row 5) is out of view, so only the top, start and end handles are drawn.
      expect(handles.bottom).toHaveLength(0);
      expect(handles.top).toHaveLength(1);

      for (const edge of ['start', 'end'] as const) {
        expect(handles[edge]).toHaveLength(1);

        const handleCenterY = handles[edge][0].y + (handles[edge][0].height / 2);

        // Over the frozen row, where the user can see the selection's edges.
        expect(handleCenterY).toBeGreaterThan(cell.y);
        expect(handleCenterY).toBeLessThan(cell.y + cell.height);
      }
    });

    test('draws each handle once across the bottom frozen rows and the frozen columns', async () => {
      // 10 rows, fixedRowsBottom: 2 (rows 8 and 9), fixedColumnsStart: 1. The selection crosses both
      // freeze lines, so the master, the bottom, the inline-start and the bottom corner overlays each
      // draw a slice.
      await grid.initGrid({ ...ROOMY_VIEWPORT, fixedRowsBottom: 2, fixedColumnsStart: 1 });
      await grid.selectCells(5, 0, 8, 3);
      await grid.hoverCell(6, 2);

      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(3);

      for (const edge of ['top', 'bottom', 'end'] as const) {
        await expect(grid.handleInAnyOverlay(edge)).toHaveCount(1);
      }
    });

    test('draws each handle once across frozen rows when a row above them is hidden', async () => {
      // Visual row 0 is hidden, so visual rows 1 and 2 are the frozen ones (renderable rows 0 and 1).
      // The selection starts on visual row 2, so it crosses the freeze line, and its top edge is not
      // the grid boundary (visual row 1 is still above it). Walkontable works in renderable indexes,
      // so the ownership rule must read the frozen count in that space too.
      await grid.initGrid({ ...ROOMY_VIEWPORT, fixedRowsTop: 3, hiddenRows: { rows: [0] } });
      await grid.selectCells(2, 1, 5, 3);
      await grid.hoverCell(3, 2);

      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(4);

      for (const edge of ['top', 'bottom', 'start', 'end'] as const) {
        await expect(grid.handleInAnyOverlay(edge)).toHaveCount(1);
      }

      await expect(grid.frozenRowHandle('top')).toHaveCount(1);
    });

    test('resizes the selection from a handle drawn by a frozen overlay', async () => {
      await grid.initGrid({ ...ROOMY_VIEWPORT, fixedRowsTop: 2 });
      await grid.selectCells(1, 1, 5, 3);
      await grid.hoverCell(3, 2);

      // The top edge lies on frozen row 1, so the frozen-rows overlay draws its handle.
      await expect(grid.frozenRowHandle('top')).toHaveCount(1);

      await grid.dragHandleInAnyOverlayToCell('top', 0, 2);

      expect(await grid.selectedBounds()).toEqual({ top: 0, start: 1, bottom: 5, end: 3 });
    });

    test('draws each handle once across frozen columns in an RTL layout', async () => {
      await grid.initGrid({ ...ROOMY_VIEWPORT, fixedColumnsStart: 1, layoutDirection: 'rtl' });
      await grid.selectCells(4, 0, 8, 3);
      await grid.hoverCell(6, 2);

      await expect(grid.visibleHandlesInAnyOverlay()).toHaveCount(3);
      await expect(grid.handleInAnyOverlay('start')).toHaveCount(0);

      const seamBox = await grid.frozenColumnCell(6, 0).boundingBox();
      const range = await grid.rangeBox(4, 0, 8, 3);
      const end = await centerOf(grid.handleInAnyOverlay('end'));

      // The inline axis is mirrored: the end edge is the selection's left edge, the seam is on the
      // frozen column's left edge.
      expect(Math.abs(end.x - range.left)).toBeLessThanOrEqual(2);

      for (const edge of ['top', 'bottom'] as const) {
        const box = await grid.handleInAnyOverlay(edge).boundingBox();

        expect(box!.x + box!.width).toBeLessThan(seamBox!.x - 2);
        expect(box!.x).toBeGreaterThan(range.left);
      }
    });
  });
});
