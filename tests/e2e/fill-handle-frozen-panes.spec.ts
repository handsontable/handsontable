import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * The autofill fill handle (`.wtBorder.corner`) against the frozen panes. `.ht_master` starts a
 * stacking context below the overlay clones, and every frozen overlay draws its own handle.
 */
test.describe('fill handle and frozen panes', () => {
  let grid: SelectionFeaturesPage;

  const WIDE_DATA = Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 40 }, (_, col) => `R${row + 1}C${col + 1}`));

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionFeaturesPage(page, theme, bundle);
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
    // The fixture's 10 columns leave a theme like horizon barely any horizontal scroll room, and a
    // scroll that clamps short never pushes the cell under the pane. WIDE_DATA guarantees the room.
    await grid.initGrid({ data: WIDE_DATA, fixedColumnsStart: 2 });
    await grid.selectCells(5, 3, 5, 3);

    await expect(grid.fillHandle()).toBeVisible();
    await grid.scrollCellBehindFrozenPane(5, 3, 'columns');

    // The frozen pane owns those pixels now — asserting on the overlay too, so a handle that simply
    // moved somewhere else cannot pass this as "occluded".
    await expect.poll(() => grid.elementAtFillHandleCenter()).toMatch(/^ht_clone_inline_start\//);
  });

  test('lifts the fill handle above the bottom freeze seam so it stays whole', async () => {
    // 10 rows, fixedRowsBottom: 2 → row 7 is the last scrollable row and its bottom edge is the
    // seam. A handle centered there would be cut in half by the bottom overlay, so it is lifted by
    // half its height, exactly like the handle on the grid's own last row.
    await grid.initGrid({ fixedRowsBottom: 2, height: 150 });
    await grid.selectCells(7, 1, 7, 1);

    await expect(grid.fillHandle()).toHaveClass(/wtCornerBlockEndEdge/);
    await expect.poll(() => grid.elementAtFillHandleCenter()).toMatch(/^ht_master\/.*corner/);
  });

  test('leaves the frozen-column handle flush with the pane edge instead of lifting it', async () => {
    // The frozen overlay draws this handle itself and already lands it on its own edge, so it needs
    // no lift — walkontable's border.spec.js pins that alignment to the pixel.
    await grid.initGrid({ data: WIDE_DATA, fixedColumnsStart: 2 });
    await grid.selectCells(5, 1, 5, 1);

    await expect(grid.frozenColumnsFillHandle()).not.toHaveClass(/wtCornerInlineEndEdge/);
    expect(await grid.frozenFillHandleOverflow('columns')).toBeLessThanOrEqual(1);
  });

  test('leaves the frozen-top-row handle flush with the pane edge instead of lifting it', async () => {
    await grid.initGrid({ fixedRowsTop: 2 });
    await grid.selectCells(1, 1, 1, 1);

    await expect(grid.frozenTopFillHandle()).not.toHaveClass(/wtCornerBlockEndEdge/);
    expect(await grid.frozenFillHandleOverflow('rows')).toBeLessThanOrEqual(1);
  });

  test('keeps the resize pills under the frozen panes in the stack', async () => {
    await grid.initGrid({ data: WIDE_DATA, fixedColumnsStart: 2 });
    await grid.selectCells(4, 3, 6, 5);
    await grid.hoverCell(5, 4);

    await expect(grid.visibleHandles()).toHaveCount(4);

    const stack = await grid.selectionStackOrder();

    expect(stack.resizeHandle).toBeLessThan(stack.frozenColumnsPane);
  });

  test.describe('the fill handle of a frozen top row', () => {
    // The `top` overlay's holder reaches a few pixels below the frozen rows so the handle of a
    // selection ending there can hang past them (#6937). That strip paints above both inline panes,
    // so a handle the `top` overlay draws for a column the viewport no longer shows covered the row
    // headers or the frozen columns of the rows below.

    test('stays off the row headers when its column scrolls behind them', async () => {
      await grid.initGrid({ data: WIDE_DATA, fixedRowsTop: 1 });
      await grid.selectCells(0, 0, 0, 0);

      // The handle hangs below the frozen row while its column is on screen (#6937).
      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);

      // A short scroll keeps column 0 in the band the `top` overlay renders, so the draw it triggers
      // re-renders that overlay instead of dropping the column.
      await grid.scrollCellEndUnderInlinePane(0, 0, 'start');

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual([]);

      // Back on screen, so a stale visible-range snapshot would keep the handle hidden.
      await grid.scrollToColumn(0);

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);
    });

    test('stays off the row headers in RTL', async () => {
      await grid.initGrid({ data: WIDE_DATA, fixedRowsTop: 1, layoutDirection: 'rtl' });
      await grid.selectCells(0, 0, 0, 0);

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);

      await grid.scrollCellEndUnderInlinePane(0, 0, 'start');

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual([]);

      await grid.scrollToColumn(0);

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);
    });

    test('leaves a frozen column\'s handle to the frozen corner when the grid scrolls', async () => {
      await grid.initGrid({ data: WIDE_DATA, fixedRowsTop: 1, fixedColumnsStart: 1 });
      await grid.selectCells(0, 0, 0, 0);

      // The corner overlay draws the handle, overhang included. The handle is centered on the
      // freeze line, so part of it lies over the scrollable part: compare the drawing overlays only.
      const drawingOverlays = async() => Array.from(new Set(
        (await grid.fillHandlesBelowFrozenRows()).map(hit => hit.split('@')[0])
      ));

      await expect.poll(() => grid.fillHandlesBelowFrozenRows())
        .toContain('top_inline_start_corner@inline_start');
      await expect.poll(drawingOverlays).toEqual(['top_inline_start_corner']);

      // Column 0 stays in the band the `top` overlay renders, so it went on drawing its own copy of
      // the handle there, one scroll offset off the cell and over the frozen column.
      await grid.scrollCellEndUnderInlinePane(0, 1, 'start');

      await expect.poll(drawingOverlays).toEqual(['top_inline_start_corner']);
      await expect.poll(() => grid.fillHandlesBelowFrozenRows())
        .toContain('top_inline_start_corner@inline_start');
    });

    // An ownership guard, not a repro: it also passes with the gate disabled, because the corner
    // overlay's handle covers the `top` overlay's copy. It pins that the corner overlay keeps drawing
    // the overhang once the `top` overlay stops.
    test('leaves an inline-end frozen column\'s handle to the frozen corner', async () => {
      await grid.initGrid({ data: WIDE_DATA, fixedRowsTop: 1, fixedColumnsEnd: 2 });
      await grid.selectCells(0, 39, 0, 39);

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top_inline_end_corner@inline_end']);

      // At the end of the scroll range the `top` overlay renders the end columns too, under the corner.
      await grid.scrollToColumn(37);

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top_inline_end_corner@inline_end']);
    });

    test('stays off the inline-end frozen columns when its column scrolls under them', async () => {
      await grid.initGrid({ data: WIDE_DATA, fixedRowsTop: 1, fixedColumnsEnd: 2 });
      await grid.scrollToColumn(20);

      const col = await grid.lastColumnClearOfInlineEndPane(0);

      await grid.selectCells(0, col, 0, col);
      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);

      await grid.scrollCellEndUnderInlinePane(0, col, 'end');

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual([]);

      await grid.scrollToColumn(col);

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);
    });

    test('stays off the inline-end frozen columns in RTL', async () => {
      await grid.initGrid({ data: WIDE_DATA, fixedRowsTop: 1, fixedColumnsEnd: 2, layoutDirection: 'rtl' });
      await grid.scrollToColumn(20);

      const col = await grid.lastColumnClearOfInlineEndPane(0);

      await grid.selectCells(0, col, 0, col);
      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);

      await grid.scrollCellEndUnderInlinePane(0, col, 'end');

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual([]);

      await grid.scrollToColumn(col);

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);
    });

    test('keeps the handle of the last column when it is wider than the viewport and scrolled to the end', async () => {
      // The visible range counts a column as fully visible only when it is whole, and a column wider
      // than the viewport never is, so the last column's edge is read off the cell at the scroll end.
      const colWidths = Array.from({ length: 40 }, (_, col) => (col === 39 ? 700 : 60));

      await grid.initGrid({ data: WIDE_DATA, fixedRowsTop: 1, colWidths });
      await grid.selectCells(0, 39, 0, 39);
      await grid.scrollHolderToInlineEnd();

      await expect.poll(() => grid.fillHandlesBelowFrozenRows()).toEqual(['top@main']);
    });
  });

  test('hides the fill handle behind the bottom frozen rows when the cell scrolls under them', async () => {
    await grid.initGrid({ fixedRowsBottom: 2, height: 150 });
    await grid.selectCells(3, 1, 3, 1);

    await expect(grid.fillHandle()).toBeVisible();
    await grid.scrollCellBehindFrozenPane(3, 1, 'rows');

    await expect.poll(() => grid.elementAtFillHandleCenter()).toMatch(/^ht_clone_bottom\//);
  });
});
