import { type Page, type Locator, expect } from '@playwright/test';
import type { CellValue } from './windowTypes';

/**
 * Page Object for the selection features fixture
 * (tests/fixtures/demo/selection-features.html).
 *
 * The fixture runs a grid with `selectionHandles` and `moveCells` enabled.
 * Tests express intent (`selectCells`, `hoverCell`, `visibleHandles`); the
 * selectors and the `window.hot` driving mechanics live here. Locators are
 * scoped to the master overlay — the frozen-pane clones duplicate the border
 * elements, so an unscoped match would be ambiguous.
 */
export class SelectionFeaturesPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render (web-first wait on
   * a real DOM condition).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/selection-features.html?theme=${this.theme}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuild the grid with the default selection-feature settings merged with
   * the given overrides — a fresh instance per test, no cross-test state.
   */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initSelectionGrid(settings), overrides);
    await expect(this.grid.locator('.ht-wrapper')).toBeVisible();
  }

  /**
   * Rebuild the grid with reordered indexes and a value getter that distinguishes displayed
   * and source values.
   */
  async initGridWithValueGetter(): Promise<void> {
    await this.page.evaluate(() => window.initSelectionGrid({
      valueGetter: value => `Display: ${value}`,
      manualRowMove: [1, 0, 2, 3, 4, 5, 6, 7, 8, 9],
      manualColumnMove: [1, 0, 2, 3, 4, 5, 6, 7, 8, 9],
    }));
    await expect(this.grid.locator('.ht-wrapper')).toBeVisible();
  }

  /**
   * Rebuild the grid with enough rows and deterministic timers for auto-scroll tests.
   */
  async initLongAutoScrollGrid(): Promise<void> {
    await this.page.evaluate(() => window.initSelectionGrid({
      data: Array.from({ length: 100 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => `R${row + 1}C${col + 1}`)),
      height: 150,
      dragToScroll: {
        interval: {
          min: 50,
          max: 50,
        },
      },
    }));
    await expect(this.grid.locator('.ht-wrapper')).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** Select a cell range through the instance API. */
  async selectCells(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.page.evaluate(range => window.hot.selectCells([range]), [fromRow, fromCol, toRow, toCol]);
  }

  /** Clear the selection through the instance API. */
  async deselect(): Promise<void> {
    await this.page.evaluate(() => window.hot.deselectCell());
  }

  /** Destroy the grid instance. */
  async destroyGrid(): Promise<void> {
    await this.page.evaluate(() => window.hot.destroy());
  }

  /**
   * Move a selected range through the MoveCells plugin API.
   */
  async moveRange(
    [fromRow, fromCol, toRow, toCol]: [number, number, number, number],
    [targetRow, targetCol]: [number, number],
  ): Promise<boolean> {
    return this.page.evaluate(({ from, target }) => {
      const hot = window.hot;

      hot.selectCells([from]);

      return hot.getPlugin('moveCells').moveCellRange(
        hot.getSelectedRangeLast(),
        hot._createCellCoords(target[0], target[1]),
      );
    }, { from: [fromRow, fromCol, toRow, toCol], target: [targetRow, targetCol] });
  }

  /**
   * Read a raw source value without applying valueGetter.
   */
  async sourceCellValue(row: number, col: number): Promise<CellValue> {
    return this.page.evaluate(([r, c]) => window.hot.getSourceDataAtCell(r, c), [row, col]);
  }

  /**
   * Undo the last action.
   */
  async undo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').undo());
  }

  /**
   * Redo the last undone action.
   */
  async redo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').redo());
  }

  /**
   * Start dragging the bottom move zone below the scrollable viewport.
   */
  async dragBottomMoveZoneBelowViewport(): Promise<void> {
    await this.#dragElementBelowViewport(this.visibleMoveZones().nth(1));
  }

  /**
   * Start dragging the bottom selection handle below the scrollable viewport.
   */
  async dragBottomHandleBelowViewport(): Promise<void> {
    await this.#dragElementBelowViewport(this.handle('bottom'));
  }

  /**
   * Drag the outer half of a move zone to the center of a target cell.
   */
  async dragOuterMoveZoneToCell(edge: 'bottom' | 'end', row: number, col: number): Promise<void> {
    const isBottomEdge = edge === 'bottom';
    const moveZoneBox = await this.visibleMoveZones().nth(isBottomEdge ? 1 : 3).boundingBox();
    const targetBox = await this.cell(row, col).boundingBox();

    if (!moveZoneBox || !targetBox) {
      throw new Error('The move zone or target cell is not rendered.');
    }

    await this.page.mouse.move(
      isBottomEdge ? moveZoneBox.x + (moveZoneBox.width / 2) : moveZoneBox.x + moveZoneBox.width - 1,
      isBottomEdge ? moveZoneBox.y + moveZoneBox.height - 1 : moveZoneBox.y + (moveZoneBox.height / 2),
    );
    await this.page.mouse.down();
    await this.page.mouse.move(
      targetBox.x + (targetBox.width / 2),
      targetBox.y + (targetBox.height / 2),
    );
    await this.page.mouse.up();
  }

  /**
   * Press the bottom selection handle without releasing the pointer.
   */
  async pressBottomHandle(): Promise<void> {
    const handleBox = await this.handle('bottom').boundingBox();

    if (!handleBox) {
      throw new Error('The bottom selection handle is not rendered.');
    }

    await this.page.mouse.move(
      handleBox.x + (handleBox.width / 2),
      handleBox.y + (handleBox.height / 2),
    );
    await this.page.mouse.down();
  }

  /**
   * Drag a selection handle to the center of a rendered cell.
   */
  async dragHandleToCell(edge: 'top' | 'bottom' | 'start' | 'end', row: number, col: number): Promise<void> {
    const handleBox = await this.handle(edge).boundingBox();
    const targetBox = await this.cell(row, col).boundingBox();

    if (!handleBox || !targetBox) {
      throw new Error('The selection handle or target cell is not rendered.');
    }

    await this.page.mouse.move(
      handleBox.x + (handleBox.width / 2),
      handleBox.y + (handleBox.height / 2),
    );
    await this.page.mouse.down();
    await this.page.mouse.move(
      targetBox.x + (targetBox.width / 2),
      targetBox.y + (targetBox.height / 2),
    );
    await this.page.mouse.up();
  }

  /**
   * Release the active pointer drag.
   */
  async releasePointer(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * Cancel the active pointer drag.
   */
  async cancelPointerDrag(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Install Playwright's deterministic browser clock.
   */
  async installClock(): Promise<void> {
    await this.page.clock.install();
  }

  /**
   * Advance browser timers by the given number of milliseconds.
   */
  async advanceClock(milliseconds: number): Promise<void> {
    await this.page.clock.fastForward(milliseconds);
  }

  /**
   * Read the first fully visible visual row.
   */
  async firstFullyVisibleRow(): Promise<number> {
    return this.page.evaluate(() => window.hot.getFirstFullyVisibleRow());
  }

  /**
   * Read the last fully visible visual row.
   */
  async lastFullyVisibleRow(): Promise<number> {
    return this.page.evaluate(() => window.hot.getLastFullyVisibleRow());
  }

  /**
   * Scroll the target row to the bottom of the viewport.
   */
  async scrollRowToBottom(row: number): Promise<void> {
    await this.page.evaluate(targetRow => window.hot.scrollViewportTo({
      row: targetRow,
      verticalSnap: 'bottom',
    }), row);
    await expect(this.cell(row, 0)).toBeVisible();
  }

  /**
   * Read the selected range's bottom visual row.
   */
  async selectedBottomRow(): Promise<number> {
    return this.page.evaluate(() => window.hot.getSelectedRangeLast().getBottomEndCorner().row ?? -1);
  }

  /**
   * Read the normalized bounds of the latest selected range.
   */
  async selectedBounds(): Promise<{ top: number, start: number, bottom: number, end: number }> {
    return this.page.evaluate(() => {
      const range = window.hot.getSelectedRangeLast();
      const topStart = range.getTopStartCorner();
      const bottomEnd = range.getBottomEndCorner();

      return {
        top: topStart.row ?? -1,
        start: topStart.col ?? -1,
        bottom: bottomEnd.row ?? -1,
        end: bottomEnd.col ?? -1,
      };
    });
  }

  /**
   * Check whether DragToScroll is listening for pointer movement.
   */
  async isDragToScrollListening(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('dragToScroll').isListening());
  }

  /**
   * Check whether the move ghost matches the last rendered row's vertical bounds.
   */
  async isMoveGhostAlignedWithLastRenderedRow(): Promise<boolean> {
    const lastRenderedRow = await this.page.evaluate(() => window.hot.getLastRenderedVisibleRow());
    const ghostBox = await this.moveGhost().boundingBox();
    const rowBox = await this.cell(lastRenderedRow, 0).boundingBox();

    if (!ghostBox || !rowBox) {
      return false;
    }

    return Math.abs(ghostBox.y - rowBox.y) <= 1 &&
      Math.abs(ghostBox.height - rowBox.height) <= 1;
  }

  /** Hover a cell with the real pointer (drives the handle-visibility logic). */
  async hoverCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).hover();
  }

  /** Hover a cell rendered by the top-left frozen overlay. */
  async hoverFrozenCornerCell(row: number, col: number): Promise<void> {
    await this.page.locator('.ht_clone_top_left_corner').getByTestId(`cell-${row}-${col}`).hover();
  }

  /**
   * The visible selection-adjust handle for an edge, scoped to the master
   * overlay. Every border instance (focus, area, fill) owns a full handle set,
   * so the non-visible duplicates are filtered out to keep the locator strict.
   */
  handle(edge: 'top' | 'bottom' | 'start' | 'end'): Locator {
    return this.page.locator(`.ht_master .wtSelectionHandle--${edge}:visible`);
  }

  /** The currently visible selection-adjust handles in the master overlay. */
  visibleHandles(): Locator {
    return this.page.locator('.ht_master .wtSelectionHandle:visible');
  }

  /** The currently visible move-zone bands in the master overlay. */
  visibleMoveZones(): Locator {
    return this.page.locator('.ht_master .wtMoveZone:visible');
  }

  /**
   * The grid's root wrapper carrying the `ht__moving` drag-state class. The
   * class lands on the wrapper Handsontable creates inside the container, not
   * on the container itself.
   */
  movingRoot(): Locator {
    return this.page.locator('.handsontable.ht__moving');
  }

  /**
   * The grid root carrying an active selection-resize class.
   */
  resizingRoot(): Locator {
    return this.page.locator('[class*="ht__resizing-selection--"]');
  }

  /** The document-level move preview ghost. */
  moveGhost(): Locator {
    return this.page.locator('.wtMoveGhost');
  }

  /** The union bounding box of a cell range — the selection's visual extent. */
  async rangeBox(
    fromRow: number, fromCol: number, toRow: number, toCol: number,
  ): Promise<{ left: number, right: number, top: number, bottom: number }> {
    const fromBox = await this.cell(fromRow, fromCol).boundingBox();
    const toBox = await this.cell(toRow, toCol).boundingBox();

    if (!fromBox || !toBox) {
      throw new Error('The range corner cells are not rendered.');
    }

    return {
      left: Math.min(fromBox.x, toBox.x),
      right: Math.max(fromBox.x + fromBox.width, toBox.x + toBox.width),
      top: Math.min(fromBox.y, toBox.y),
      bottom: Math.max(fromBox.y + fromBox.height, toBox.y + toBox.height),
    };
  }

  /**
   * Press an interaction affordance and move the pointer below the master viewport.
   */
  async #dragElementBelowViewport(element: Locator): Promise<void> {
    const elementBox = await element.boundingBox();
    const viewportBox = await this.page.locator('.ht_master .wtHolder').boundingBox();

    if (!elementBox || !viewportBox) {
      throw new Error('The drag affordance or grid viewport is not rendered.');
    }

    await this.page.mouse.move(
      elementBox.x + (elementBox.width / 2),
      elementBox.y + (elementBox.height / 2),
    );
    await this.page.mouse.down();
    await this.page.mouse.move(
      viewportBox.x + (viewportBox.width / 2),
      viewportBox.y + viewportBox.height + 40,
    );
  }
}
