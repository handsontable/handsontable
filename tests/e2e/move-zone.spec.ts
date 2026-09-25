import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * moveCells edge move bands (migrated from the frozen Jasmine walkontable
 * suite). The bands are thin overlays along each selection edge that show a
 * grab cursor and start a move drag on mousedown.
 */
test.describe('moveCells edge move bands', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  test('renders four grab-cursor bands around the selection, below the resize pills', async () => {
    await grid.selectCells(1, 1, 3, 3);

    const bands = grid.visibleMoveZones();

    await expect(bands).toHaveCount(4);

    for (let index = 0; index < 4; index++) {
      // The grab cursor is the move affordance; z-index 100 keeps the bands
      // below the resize pills (z-index 115) where they overlap in corners.
      await expect(bands.nth(index)).toHaveCSS('cursor', 'grab');
      await expect(bands.nth(index)).toHaveCSS('z-index', '100');
    }
  });

  test('starts a move drag from each edge band and cancels on Escape', async ({ page }) => {
    for (let index = 0; index < 4; index++) {
      await grid.initGrid();
      await grid.selectCells(1, 1, 3, 3);

      const bands = grid.visibleMoveZones();

      await expect(bands).toHaveCount(4);

      const band = bands.nth(index);
      const box = await band.boundingBox();

      expect(box).not.toBeNull();

      // Pressing an edge band enters the move-drag state (ht__moving on the
      // grid's root wrapper); Escape cancels it and leaves the grid idle again.
      await page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
      await page.mouse.down();

      await expect(grid.movingRoot()).toHaveCount(1);

      await page.keyboard.press('Escape');
      await page.mouse.up();

      await expect(grid.movingRoot()).toHaveCount(0);
    }
  });

  test('cancels a drag on Escape when the grid was not listening at press time', async ({ page }) => {
    await grid.selectCells(1, 1, 1, 1);
    // An outside click with `outsideClickDeselects: false` (or focusing another instance)
    // unlistens the grid while the selection — and its move bands — stays visible. The band
    // swallows the mousedown before TableView can re-listen, and the Escape cancel shortcut
    // lives in the `grid` context, which only dispatches while the instance is listening.
    await grid.unlisten();

    const band = grid.visibleMoveZones().first();
    const box = await band.boundingBox();

    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
    await page.mouse.down();

    await expect(grid.movingRoot()).toHaveCount(1);

    // Park the pointer over another cell so that, if Escape failed to cancel, the release
    // below would commit a real move and the data assertions would catch it.
    const targetBox = await grid.cell(4, 4).boundingBox();

    expect(targetBox).not.toBeNull();

    await page.mouse.move(targetBox!.x + (targetBox!.width / 2), targetBox!.y + (targetBox!.height / 2));
    await page.keyboard.press('Escape');

    await expect(grid.movingRoot()).toHaveCount(0);

    await page.mouse.up();

    await expect(grid.cell(1, 1)).toHaveText('R2C2');
    await expect(grid.cell(4, 4)).toHaveText('R5C5');
  });

  test('hides source move affordances while a drag preview is active', async ({ page }) => {
    await grid.selectCells(1, 1, 3, 3);
    await grid.hoverCell(2, 2);

    await expect(grid.visibleHandles()).toHaveCount(4);
    await expect(grid.visibleMoveZones()).toHaveCount(4);

    const box = await grid.visibleMoveZones().first().boundingBox();

    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + 10, box!.y + (box!.height / 2));
    await page.mouse.down();

    await expect(grid.movingRoot()).toHaveCount(1);
    await expect(grid.visibleHandles()).toHaveCount(0);
    await expect(grid.visibleMoveZones()).toHaveCount(0);

    await page.keyboard.press('Escape');
    await page.mouse.up();

    await expect(grid.movingRoot()).toHaveCount(0);
    await grid.hoverCell(2, 2);
    await expect(grid.visibleHandles()).toHaveCount(4);
    await expect(grid.visibleMoveZones()).toHaveCount(4);
  });

  test('removes the move preview when the grid is destroyed during a drag', async ({ page }) => {
    await grid.selectCells(1, 1, 3, 3);

    const box = await grid.visibleMoveZones().first().boundingBox();

    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
    await page.mouse.down();

    await expect(grid.movingRoot()).toHaveCount(1);
    await expect(grid.moveGhost()).toHaveCount(1);

    await grid.destroyGrid();

    await expect(grid.moveGhost()).toHaveCount(0);
    await expect(page.locator('body')).toHaveCSS('cursor', 'auto');
    await page.mouse.up();
  });

  test('moves visual source values without persisting valueGetter output', async () => {
    await grid.initGridWithValueGetter();

    await expect(grid.cell(0, 0)).toHaveText('Display: R2C2');
    await expect(grid.moveRange([0, 0, 0, 0], [2, 2])).resolves.toBe(true);

    expect(await grid.sourceCellValue(1, 0)).toBe(null);
    expect(await grid.sourceCellValue(2, 2)).toBe('R2C2');
    await expect(grid.cell(2, 2)).toHaveText('Display: R2C2');

    await grid.undo();

    expect(await grid.sourceCellValue(1, 0)).toBe('R2C2');
    expect(await grid.sourceCellValue(2, 2)).toBe('R3C3');

    await grid.redo();

    expect(await grid.sourceCellValue(1, 0)).toBe(null);
    expect(await grid.sourceCellValue(2, 2)).toBe('R2C2');
    await expect(grid.cell(2, 2)).toHaveText('Display: R2C2');
  });

  test('scrolls beyond the viewport while dragging a selection', async () => {
    await grid.initGrid({
      height: 150,
      rowHeights: [23, 23, 23, 23, 60, 23, 23, 23, 23, 40],
    });
    await grid.selectCells(1, 1, 1, 1);

    const initiallyVisibleBottomRow = await grid.lastFullyVisibleRow();

    await grid.dragBottomMoveZoneBelowViewport();

    await expect(grid.movingRoot()).toHaveCount(1);
    await expect.poll(() => grid.firstFullyVisibleRow()).toBeGreaterThan(2);
    await expect.poll(() => grid.isMoveGhostAlignedWithLastRenderedRow()).toBe(true);

    await grid.releasePointer();

    await expect.poll(() => grid.selectedBottomRow()).toBeGreaterThan(initiallyVisibleBottomRow);
  });

  test('updates a multi-row ghost when its target extends beyond the viewport', async () => {
    await grid.installClock();
    await grid.initLongAutoScrollGrid();
    await grid.selectCells(1, 1, 20, 2);
    await grid.scrollRowToBottom(20);

    await grid.dragBottomMoveZoneBelowViewport();
    await grid.advanceClock(100);

    expect(await grid.firstFullyVisibleRow()).toBeGreaterThan(0);
    await expect(grid.moveGhost()).toBeVisible();

    await grid.cancelPointerDrag();
    await grid.releasePointer();
  });

  test('stops auto-scroll when a move drag is canceled', async () => {
    await grid.installClock();
    await grid.initLongAutoScrollGrid();
    await grid.selectCells(1, 1, 1, 1);

    await grid.dragBottomMoveZoneBelowViewport();
    await grid.advanceClock(50);
    expect(await grid.firstFullyVisibleRow()).toBeGreaterThan(0);
    expect(await grid.isDragToScrollListening()).toBe(true);

    await grid.cancelPointerDrag();

    await expect(grid.movingRoot()).toHaveCount(0);
    expect(await grid.isDragToScrollListening()).toBe(false);

    const rowAfterCancel = await grid.firstFullyVisibleRow();

    await grid.advanceClock(500);
    expect(await grid.firstFullyVisibleRow()).toBe(rowAfterCancel);
    await grid.releasePointer();
  });

  test('keeps the grab offset inside a single-cell selection', async () => {
    await grid.selectCells(1, 1, 1, 1);
    await grid.dragOuterMoveZoneToCell('bottom', 4, 4);

    expect(await grid.sourceCellValue(1, 1)).toBe(null);
    expect(await grid.sourceCellValue(4, 4)).toBe('R2C2');

    await grid.goto();
    await grid.selectCells(1, 1, 1, 1);
    await grid.dragOuterMoveZoneToCell('end', 4, 4);

    expect(await grid.sourceCellValue(1, 1)).toBe(null);
    expect(await grid.sourceCellValue(4, 4)).toBe('R2C2');
  });

  test('shows no move bands when moveCells is disabled', async () => {
    await grid.initGrid({ moveCells: false });
    await grid.selectCells(1, 1, 3, 3);

    // The selection renders, but no move affordance may be offered.
    await expect(grid.cell(1, 1)).toBeVisible();
    await expect(grid.visibleMoveZones()).toHaveCount(0);
  });

  test('hides the bands when the selection is deselected', async () => {
    await grid.selectCells(1, 1, 3, 3);

    await expect(grid.visibleMoveZones()).toHaveCount(4);

    await grid.deselect();

    await expect(grid.visibleMoveZones()).toHaveCount(0);
  });

  test('moves the data when a band is dragged to a new location', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await grid.dragMoveZoneToCell(5, 5);

    expect(await grid.cellValue(5, 5)).toBe('R3C3');
    expect(await grid.cellValue(2, 2)).toBe(null);
  });

  test('moves a single selected cell', async () => {
    await grid.selectCells(2, 2, 2, 2);

    // A single cell is movable too — the bands are not limited to multi-cell ranges.
    await expect(grid.visibleMoveZones()).toHaveCount(4);

    await grid.dragMoveZoneToCell(6, 4);

    expect(await grid.cellValue(6, 4)).toBe('R3C3');
    expect(await grid.cellValue(2, 2)).toBe(null);
    expect(await grid.selectedBounds()).toEqual({ top: 6, start: 4, bottom: 6, end: 4 });
  });

  test('renders the ghost preview over the drop target while dragging', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await grid.startMoveZoneDragOverCell(5, 5);

    await expect(grid.moveGhost()).toBeVisible();
    expect(await grid.isMoveGhostOverCell(5, 5)).toBe(true);

    await grid.releasePointer();
  });

  test('renders the ghost preview over the drop target in an RTL layout', async () => {
    await grid.initGrid({ layoutDirection: 'rtl' });
    await grid.selectCells(2, 2, 3, 3);

    await grid.startMoveZoneDragOverCell(5, 5);

    await expect(grid.moveGhost()).toBeVisible();

    // In RTL the lower column index sits visually on the right, so the ghost box must be the union
    // of the corner rects. Computing width as `end.right - start.left` goes negative here, the style
    // write is rejected, and the ghost collapses to a border-only sliver — so assert it spans the
    // full 2x2 block rather than merely overlapping.
    const ghost = await grid.moveGhostSize();
    const cell = await grid.cellSize(5, 5);

    expect(ghost.width).toBeGreaterThanOrEqual(cell.width * 1.5);
    expect(ghost.height).toBeGreaterThanOrEqual(cell.height * 1.5);
    expect(await grid.isMoveGhostOverCell(5, 5)).toBe(true);

    await grid.releasePointer();
  });

  test('holds the grabbing cursor during the drag and clears it on drop', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await grid.startMoveZoneDragOverCell(5, 5);

    // The cursor lives on the body so it persists while the pointer is outside the grid.
    expect(await grid.bodyCursor()).toBe('grabbing');

    await grid.releasePointer();

    expect(await grid.bodyCursor()).toBe('');
  });

  test('adds the ht__moving class during the drag and removes it on drop', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await grid.startMoveZoneDragOverCell(5, 5);

    await expect(grid.movingRoot()).toHaveCount(1);

    await grid.releasePointer();

    await expect(grid.movingRoot()).toHaveCount(0);
  });

  test('removes the ghost element after the drop', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await grid.startMoveZoneDragOverCell(5, 5);

    await expect(grid.moveGhost()).toBeVisible();

    await grid.releasePointer();

    await expect(grid.moveGhost()).toHaveCount(0);
  });

  test('copies instead of moving when Ctrl is held on drop', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await grid.dragMoveZoneToCell(5, 5, 'Control');

    expect(await grid.cellValue(5, 5)).toBe('R3C3');
    // Copy: the source survives.
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
  });

  test('copies instead of moving when Meta is held on drop', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await grid.dragMoveZoneToCell(5, 5, 'Meta');

    expect(await grid.cellValue(5, 5)).toBe('R3C3');
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
  });

  test('records no undo entry for a click on a move zone without dragging', async ({ page }) => {
    // A mousedown + mouseup on the same pixel resolves the move target back to the source, which
    // used to run the whole commit pipeline for zero data change — every click on a selection
    // border consumed one undo entry and pushed the user's real edits out of the undo stack.
    await grid.selectCells(2, 2, 3, 3);

    const box = await grid.visibleMoveZones().first().boundingBox();

    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
    await page.mouse.down();
    await page.mouse.up();

    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.doneActionsCount()).toBe(0);
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('records no undo entry for a macOS-style Ctrl+click on a move zone', async ({ page }) => {
    // On macOS a Ctrl+click reaches the plugin as button 0 with ctrlKey set, so it passes the
    // right-click guard — and because Ctrl on drop means "copy", it used to commit a no-op copy.
    await grid.selectCells(2, 2, 3, 3);

    const box = await grid.visibleMoveZones().first().boundingBox();

    expect(box).not.toBeNull();

    await page.keyboard.down('Control');
    await page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
    await page.mouse.down();
    await page.mouse.up();
    await page.keyboard.up('Control');

    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.doneActionsCount()).toBe(0);
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('keeps the autofill fill handle clickable above the move bands', async ({ page }) => {
    // The bottom/end bands span the SE corner where the fill handle sits. The handle must win
    // that overlap (z-index 110 vs the bands' 100) — otherwise pressing it starts a move drag
    // instead of autofill.
    await grid.selectCells(2, 2, 2, 2);

    const corner = page.locator('.wtBorder.corner:visible').first();
    const cornerBox = await corner.boundingBox();

    expect(cornerBox).not.toBeNull();

    const targetBox = await grid.cell(4, 2).boundingBox();

    expect(targetBox).not.toBeNull();

    await page.mouse.move(cornerBox!.x + (cornerBox!.width / 2), cornerBox!.y + (cornerBox!.height / 2));
    await page.mouse.down();

    // A move drag would flag the root with ht__moving; autofill must not.
    await expect(grid.movingRoot()).toHaveCount(0);

    await page.mouse.move(targetBox!.x + (targetBox!.width / 2), targetBox!.y + (targetBox!.height / 2), { steps: 2 });
    await page.mouse.up();

    // Autofill copied the value down; nothing moved.
    expect(await grid.cellValue(3, 2)).toBe('R3C3');
    expect(await grid.cellValue(4, 2)).toBe('R3C3');
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
  });

  test('records no undo entry when a drag is released back at its origin', async ({ page }) => {
    await grid.selectCells(2, 2, 3, 3);

    const box = await grid.visibleMoveZones().first().boundingBox();

    expect(box).not.toBeNull();

    const pressX = box!.x + (box!.width / 2);
    const pressY = box!.y + (box!.height / 2);
    // An interior cell: dragging near the viewport edge (e.g. over column 6 in the wider horizon
    // theme) can trigger DragToScroll on a slow runner, and once the viewport scrolls the press
    // pixel no longer maps to the press cell — the gesture is then a real move, not a click.
    const awayBox = await grid.cell(4, 4).boundingBox();

    expect(awayBox).not.toBeNull();

    // Drag away and back to the exact press point, so the resolved target equals the source.
    await page.mouse.move(pressX, pressY);
    await page.mouse.down();
    await page.mouse.move(awayBox!.x + (awayBox!.width / 2), awayBox!.y + (awayBox!.height / 2), { steps: 2 });
    await page.mouse.move(pressX, pressY, { steps: 2 });
    await page.mouse.up();

    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.doneActionsCount()).toBe(0);
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('honors the grab offset when dragging from a non-top-left cell of a 2x2 range', async () => {
    await grid.selectCells(1, 1, 2, 2);

    // Grab the range's bottom-end cell (offset (1, 1) within the block) and drop on (6, 6). The
    // grabbed cell must land under the pointer, so the block's top-left ends up at (5, 5) — a
    // regression that ignores the offset would put the top-left at (6, 6) instead.
    await grid.dragRangeByCellCornerToCell(2, 2, 6, 6);

    expect(await grid.cellValue(5, 5)).toBe('R2C2');
    expect(await grid.cellValue(1, 1)).toBe(null);
    expect(await grid.selectedBounds()).toEqual({ top: 5, start: 5, bottom: 6, end: 6 });
  });

  test('shows no move bands when disableVisualSelection is set', async () => {
    await grid.initGrid({ disableVisualSelection: true });
    await grid.selectCells(2, 2, 3, 3);

    await expect(grid.visibleMoveZones()).toHaveCount(0);
  });

  test('does not move data when disableVisualSelection is set', async () => {
    await grid.initGrid({ disableVisualSelection: true });
    await grid.selectCells(2, 2, 3, 3);

    // With no bands there is nothing to grab, so the data must be untouched.
    await expect(grid.visibleMoveZones()).toHaveCount(0);
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.cellValue(5, 5)).toBe('R6C6');
  });

  test('shows no move bands for a full row selection', async () => {
    await grid.selectCells(2, -1, 2, 9);

    await expect(grid.visibleMoveZones()).toHaveCount(0);
  });

  test('shows no move bands for a full column selection', async () => {
    await grid.selectCells(-1, 2, 9, 2);

    await expect(grid.visibleMoveZones()).toHaveCount(0);
  });

  test('selects the cell under the pointer when a band press resolves to a click', async ({ page }) => {
    // The band swallowed the mousedown (`stopImmediatePropagation` + `preventDefault`), so without
    // an explicit selection here a click on the band did nothing at all — no move (correct) but
    // also no selection change, unlike a click anywhere else in the grid.
    await grid.selectCells(2, 2, 3, 3);

    const box = await grid.visibleMoveZones().first().boundingBox();

    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
    await page.mouse.down();
    await page.mouse.up();

    // The click collapses the selection to the single cell under the pointer, exactly as an
    // unswallowed click would; the data and undo stack stay untouched.
    const bounds = await grid.selectedBounds();

    expect(bounds.top).toBe(bounds.bottom);
    expect(bounds.start).toBe(bounds.end);
    expect(await grid.cellValue(2, 2)).toBe('R3C3');
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('shows no move bands while a cell editor is open', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await expect(grid.visibleMoveZones()).toHaveCount(4);

    // Starting a drag mid-edit would swallow the mousedown that normally commits the editor, so
    // the release could rewrite a cell whose editor still holds an uncommitted value.
    await grid.openEditor();

    await expect(grid.visibleMoveZones()).toHaveCount(0);

    await grid.closeEditor();

    await expect(grid.visibleMoveZones()).toHaveCount(4);
  });

  test('hides the move bands when the plugin is disabled at runtime', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await expect(grid.visibleMoveZones()).toHaveCount(4);

    // `disablePlugin()` must win over the still-`true` setting — otherwise the bands keep
    // rendering (and keep calling `preventDefault()`) with a mousedown that does nothing.
    await grid.setPluginEnabled('moveCells', false);

    await expect(grid.visibleMoveZones()).toHaveCount(0);

    await grid.setPluginEnabled('moveCells', true);

    await expect(grid.visibleMoveZones()).toHaveCount(4);
  });

  test('does not start a move drag on a right-press', async () => {
    await grid.selectCells(2, 2, 3, 3);

    await grid.rightPressMoveZone();

    // A right-press opens the context menu; it must not also start a move that the release commits.
    // This pins the guard in MoveCells' own `afterOnSelectionEdgeMouseDown` listener. The matching
    // guard in the Walkontable border's mousedown listener is defense-in-depth and is NOT covered
    // here — with it removed, the plugin guard alone still keeps this assertion green.
    expect(await grid.isMoveDragActive()).toBe(false);
    await expect(grid.movingRoot()).toHaveCount(0);

    await grid.releasePointer();

    expect(await grid.cellValue(2, 2)).toBe('R3C3');
  });

  test.describe('a selection crossing a frozen pane', () => {
    type Point = { x: number, y: number };

    /**
     * The box of a cell as one overlay renders it.
     */
    async function boxOf(locator: ReturnType<SelectionFeaturesPage['cell']>) {
      const box = await locator.boundingBox();

      expect(box).not.toBeNull();

      return box!;
    }

    /**
     * Points on a vertical line, a few pixels either side of it, at the given heights. A band is
     * 6px wide and centered on its edge, so a band on the line is hit by at least one of them.
     */
    function acrossVerticalLine(x: number, ys: number[]): Point[] {
      return ys.flatMap(y => [x - 2, x, x + 2].map(px => ({ x: px, y })));
    }

    /**
     * Points on a horizontal line, a few pixels either side of it, at the given offsets.
     */
    function acrossHorizontalLine(y: number, xs: number[]): Point[] {
      return xs.flatMap(x => [y - 2, y, y + 2].map(py => ({ x, y: py })));
    }

    /**
     * The vertical center of a cell box.
     */
    function middleY(box: { y: number, height: number }) {
      return box.y + (box.height / 2);
    }

    /**
     * The horizontal center of a cell box.
     */
    function middleX(box: { x: number, width: number }) {
      return box.x + (box.width / 2);
    }

    /**
     * Points just inside each outer edge of a range, at the given offsets along each edge. The
     * positive control: every one of them must land on a band.
     */
    function insideOuterEdges(
      range: { left: number, right: number, top: number, bottom: number }, xs: number[], ys: number[],
    ): Point[] {
      return [
        ...xs.map(x => ({ x, y: range.top + 1 })),
        ...xs.map(x => ({ x, y: range.bottom - 1 })),
        ...ys.map(y => ({ x: range.left + 1, y })),
        ...ys.map(y => ({ x: range.right - 1, y })),
      ];
    }

    test('draws bands on the outer edges only, across frozen rows and columns', async () => {
      await grid.initGrid({ fixedRowsTop: 2, fixedColumnsStart: 1 });
      await grid.selectCells(0, 0, 5, 3);

      // Every edge crosses one freeze line, so each is drawn by the two overlays it passes through.
      // Before the fix every overlay drew all four bands on its own slice: 16 bands, with bands on
      // both freeze lines inside the selection.
      await expect(grid.visibleMoveZonesInAnyOverlay()).toHaveCount(8);

      const range = await grid.rangeBox(0, 0, 5, 3);
      const columnSeamX = (b => b.x + b.width)(await boxOf(grid.overlayCell('inline_start', 3, 0)));
      const rowSeamY = (b => b.y + b.height)(await boxOf(grid.overlayCell('top', 1, 2)));
      const frozenRowY = middleY(await boxOf(grid.overlayCell('top_inline_start_corner', 0, 0)));
      const scrollableRowY = middleY(await boxOf(grid.overlayCell('inline_start', 3, 0)));
      const frozenColumnX = middleX(await boxOf(grid.overlayCell('top_inline_start_corner', 0, 0)));
      const scrollableColumnX = middleX(await boxOf(grid.overlayCell('top', 0, 2)));

      const seamHits = await grid.moveZoneHitsAt([
        ...acrossVerticalLine(columnSeamX, [frozenRowY, scrollableRowY]),
        ...acrossHorizontalLine(rowSeamY, [frozenColumnX, scrollableColumnX]),
      ]);

      expect(seamHits.every(hit => !hit)).toBe(true);

      const edgeHits = await grid.moveZoneHitsAt(
        insideOuterEdges(range, [frozenColumnX, scrollableColumnX], [frozenRowY, scrollableRowY]),
      );

      expect(edgeHits.every(hit => hit)).toBe(true);
    });

    test('draws bands on the outer edges only once the master no longer renders the frozen rows', async () => {
      await grid.initGrid({
        fixedRowsTop: 2,
        fixedColumnsStart: 1,
        data: Array.from({ length: 40 }, (_, row) => Array.from({ length: 10 }, (__, col) => `R${row + 1}C${col + 1}`)),
      });
      await grid.selectCells(0, 0, 16, 3);
      await grid.scrollToRow(12);

      // Scrolled past the frozen rows, the master and the frozen-columns overlay clamp the top edge to
      // their rendered band instead of rendering it behind the pane. The clamp, not the segment, is
      // what must drop their bands on the row freeze line now.
      await expect.poll(() => grid.firstRenderedRow()).toBeGreaterThan(1);
      await expect(grid.visibleMoveZonesInAnyOverlay()).toHaveCount(8);

      const rowSeamY = (b => b.y + b.height)(await boxOf(grid.overlayCell('top', 1, 2)));
      const frozenColumnX = middleX(await boxOf(grid.overlayCell('top_inline_start_corner', 0, 0)));
      const scrollableColumnX = middleX(await boxOf(grid.overlayCell('top', 0, 2)));
      const scrollableCell = await boxOf(grid.overlayCell('inline_start', 14, 0));
      const columnSeamX = scrollableCell.x + scrollableCell.width;

      expect((await grid.moveZoneHitsAt([
        ...acrossHorizontalLine(rowSeamY, [frozenColumnX, scrollableColumnX]),
        ...acrossVerticalLine(columnSeamX, [middleY(scrollableCell)]),
      ])).every(hit => !hit)).toBe(true);
    });

    test('draws no band on the column freeze line', async () => {
      await grid.initGrid({ fixedColumnsStart: 1 });
      await grid.selectCells(4, 0, 8, 3);

      // The master draws the top, bottom and end bands, and the frozen-columns overlay the top,
      // bottom and start ones, so the top and bottom edges are split at the freeze line.
      await expect(grid.visibleMoveZonesInAnyOverlay()).toHaveCount(6);

      const range = await grid.rangeBox(4, 0, 8, 3);
      const frozenCell = await boxOf(grid.overlayCell('inline_start', 6, 0));
      const columnSeamX = frozenCell.x + frozenCell.width;
      const scrollableColumnX = middleX(await boxOf(grid.cell(6, 2)));

      expect((await grid.moveZoneHitsAt(acrossVerticalLine(columnSeamX, [middleY(frozenCell)])))
        .every(hit => !hit)).toBe(true);
      expect((await grid.moveZoneHitsAt(
        insideOuterEdges(range, [middleX(frozenCell), scrollableColumnX], [middleY(frozenCell)]),
      )).every(hit => hit)).toBe(true);
    });

    test('draws no band on the column freeze line in RTL', async () => {
      await grid.initGrid({ fixedColumnsStart: 1, layoutDirection: 'rtl' });
      await grid.selectCells(4, 0, 8, 3);

      await expect(grid.visibleMoveZonesInAnyOverlay()).toHaveCount(6);

      const range = await grid.rangeBox(4, 0, 8, 3);
      const frozenCell = await boxOf(grid.overlayCell('inline_start', 6, 0));
      // The frozen column sits at the inline start, which is the right side in RTL.
      const columnSeamX = frozenCell.x;
      const scrollableColumnX = middleX(await boxOf(grid.cell(6, 2)));

      expect((await grid.moveZoneHitsAt(acrossVerticalLine(columnSeamX, [middleY(frozenCell)])))
        .every(hit => !hit)).toBe(true);
      expect((await grid.moveZoneHitsAt(
        insideOuterEdges(range, [middleX(frozenCell), scrollableColumnX], [middleY(frozenCell)]),
      )).every(hit => hit)).toBe(true);
    });

    test('draws no band on the bottom freeze line', async () => {
      // Small enough that no theme scrolls, so every row is on screen.
      await grid.initGrid({
        fixedRowsBottom: 2,
        data: Array.from({ length: 8 }, (_, row) => Array.from({ length: 6 }, (__, col) => `R${row + 1}C${col + 1}`)),
      });
      await grid.selectCells(2, 1, 7, 3);

      // The master draws the top, start and end bands, and the bottom overlay the bottom, start
      // and end ones.
      await expect(grid.visibleMoveZonesInAnyOverlay()).toHaveCount(6);

      const range = await grid.rangeBox(2, 1, 5, 3);
      const frozenCell = await boxOf(grid.overlayCell('bottom', 7, 2));
      const rowSeamY = (await boxOf(grid.overlayCell('bottom', 6, 2))).y;

      expect((await grid.moveZoneHitsAt(acrossHorizontalLine(rowSeamY, [middleX(frozenCell)])))
        .every(hit => !hit)).toBe(true);
      expect((await grid.moveZoneHitsAt([
        { x: middleX(frozenCell), y: range.top + 1 },
        { x: middleX(frozenCell), y: frozenCell.y + frozenCell.height - 1 },
        { x: range.left + 1, y: middleY(frozenCell) },
        { x: range.right - 1, y: middleY(frozenCell) },
      ])).every(hit => hit)).toBe(true);
    });

    test('decides the bands without the resize handles', async () => {
      await grid.initGrid({ fixedRowsTop: 2, fixedColumnsStart: 1, selectionHandles: false });
      await grid.selectCells(0, 0, 5, 3);

      await expect(grid.visibleMoveZonesInAnyOverlay()).toHaveCount(8);
    });

    test('keeps all four bands in the master when nothing is frozen', async () => {
      await grid.selectCells(1, 1, 3, 3);

      await expect(grid.visibleMoveZones()).toHaveCount(4);
      await expect(grid.visibleMoveZonesInAnyOverlay()).toHaveCount(4);
    });
  });
});
