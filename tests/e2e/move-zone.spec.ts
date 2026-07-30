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
      // below the resize pills (z-index 200) where they overlap in corners.
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
});
