import { type Page, type Locator, expect } from '@playwright/test';
import type { CellValue, MoveCellsHookRecord } from './windowTypes';

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

  /**
   * Stop the instance from listening to keyboard input, as an outside click with
   * `outsideClickDeselects: false` (or focusing another instance) would.
   */
  async unlisten(): Promise<void> {
    await this.page.evaluate(() => window.hot.unlisten());
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
   * Move or copy a range through the MoveCells plugin API, without going through the pointer.
   * Unlike `moveRange` this does not pre-select, so it can exercise ranges the UI would not offer.
   */
  async moveCellRange(
    [fromRow, fromCol, toRow, toCol]: [number, number, number, number],
    [targetRow, targetCol]: [number, number],
    isCopy = false,
  ): Promise<boolean> {
    return this.page.evaluate(({ from, target, copy }) => {
      const hot = window.hot;
      const range = hot._createCellRange(
        hot._createCellCoords(from[0], from[1]),
        hot._createCellCoords(from[0], from[1]),
        hot._createCellCoords(from[2], from[3]),
      );

      return hot.getPlugin('moveCells').moveCellRange(
        range,
        hot._createCellCoords(target[0], target[1]),
        copy,
      );
    }, { from: [fromRow, fromCol, toRow, toCol], target: [targetRow, targetCol], copy: isCopy });
  }

  /**
   * Read a displayed cell value.
   */
  async cellValue(row: number, col: number): Promise<CellValue> {
    return this.page.evaluate(([r, c]) => window.hot.getDataAtCell(r, c), [row, col]);
  }

  /**
   * Read a raw source value without applying valueGetter.
   */
  async sourceCellValue(row: number, col: number): Promise<CellValue> {
    return this.page.evaluate(([r, c]) => window.hot.getSourceDataAtCell(r, c), [row, col]);
  }

  /**
   * Read a cell's `className` meta — the one meta key `moveCellRange` moves with the data.
   */
  async cellClassName(row: number, col: number): Promise<string | undefined> {
    return this.page.evaluate(([r, c]) => window.hot.getCellMeta(r, c).className, [row, col]);
  }

  /**
   * The moveCells hook calls recorded since the grid was built.
   */
  async hookLog(): Promise<MoveCellsHookRecord[]> {
    return this.page.evaluate(() => window.moveCellsHookLog);
  }

  /**
   * Make the fixture's `beforeMoveCells` listener veto the next move.
   */
  async setBeforeMoveCellsVeto(shouldVeto: boolean): Promise<void> {
    await this.page.evaluate(veto => window.setBeforeMoveCellsVeto(veto), shouldVeto);
  }

  /**
   * Whether a redo is currently available.
   */
  async isRedoAvailable(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('undoRedo').isRedoAvailable());
  }

  /**
   * Whether an undo is currently available.
   */
  async isUndoAvailable(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('undoRedo').isUndoAvailable());
  }

  /**
   * How many actions sit on the undo stack — guards against a redo pushing a duplicate action.
   */
  async doneActionsCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.getPlugin('undoRedo').doneActions.length);
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
   * Drag the first visible move-zone band onto a target cell and drop.
   *
   * `modifier` is held down only for the release, which is when MoveCells reads it to decide between
   * a move and a copy.
   */
  async dragMoveZoneToCell(
    row: number, col: number, modifier?: 'Control' | 'Meta',
  ): Promise<void> {
    await this.#pressFirstMoveZone();
    await this.#movePointerToCell(row, col);

    if (modifier) {
      await this.page.keyboard.down(modifier);
    }

    await this.page.mouse.up();

    if (modifier) {
      await this.page.keyboard.up(modifier);
    }
  }

  /**
   * Press the first visible move-zone band and move the pointer over a cell, without releasing.
   */
  async startMoveZoneDragOverCell(row: number, col: number): Promise<void> {
    await this.#pressFirstMoveZone();
    await this.#movePointerToCell(row, col);
  }

  /**
   * Drag a range by grabbing it at a specific cell's bottom-end corner, then drop on a target cell.
   *
   * The grab offset MoveCells applies is derived from the pointer coordinates, not from which band
   * element was pressed — so the press has to land at the grabbed cell, on the sliver where the
   * bottom and end bands run along that cell's edges.
   */
  async dragRangeByCellCornerToCell(
    grabRow: number, grabCol: number, targetRow: number, targetCol: number,
  ): Promise<void> {
    const grabBox = await this.cell(grabRow, grabCol).boundingBox();

    if (!grabBox) {
      throw new Error('The grab cell is not rendered.');
    }

    // Press on the bottom band along the grab cell's edge, at the cell's horizontal center — the
    // exact SE corner point belongs to the autofill fill handle, which sits above the move bands.
    await this.page.mouse.move(
      grabBox.x + (grabBox.width / 2),
      grabBox.y + grabBox.height - 2,
    );
    await this.page.mouse.down();
    await this.#movePointerToCell(targetRow, targetCol);
    await this.page.mouse.up();
  }

  /**
   * Drag-select a range with the real pointer, ending with the pointer inside the new selection.
   *
   * Distinct from the `selectCells` API call: no fresh `mouseover` fires after the `mouseup`, which is
   * the condition under which the handles used to stay hidden after a drag-select.
   */
  async dragSelectCells(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.#movePointerToCell(fromRow, fromCol);
    await this.page.mouse.down();
    await this.#movePointerToCell(Math.round((fromRow + toRow) / 2), Math.round((fromCol + toCol) / 2));
    await this.#movePointerToCell(toRow, toCol);
    await this.page.mouse.up();
  }

  /**
   * Press a move-zone band with the right button — must not start a move drag.
   */
  async rightPressMoveZone(): Promise<void> {
    await this.#pressElementCenter(this.visibleMoveZones().first(), 'right');
  }

  /**
   * Press a selection handle with the right button — must not start a resize drag.
   */
  async rightPressHandle(edge: 'top' | 'bottom' | 'start' | 'end'): Promise<void> {
    await this.#pressElementCenter(this.handle(edge), 'right');
  }

  /**
   * Whether the MoveCells plugin reports an active drag.
   */
  async isMoveDragActive(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('moveCells').isDragActive());
  }

  /**
   * Whether a cell editor is currently open.
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getActiveEditor()?.isOpened() === true);
  }

  /**
   * Open the cell editor on the focused cell through the editor API — the selection stays intact,
   * unlike a dblclick, which collapses it to the clicked cell first.
   */
  async openEditor(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.listen();
      window.hot.getActiveEditor()?.beginEditing();
    });
    await expect.poll(() => this.isEditorOpened()).toBe(true);
  }

  /**
   * Close the open cell editor without committing its value.
   */
  async closeEditor(): Promise<void> {
    await this.page.evaluate(() => window.hot.getActiveEditor()?.finishEditing(true));
    await expect.poll(() => this.isEditorOpened()).toBe(false);
  }

  /**
   * Enable or disable a selection-affordance plugin at runtime, then re-render so the borders
   * re-evaluate their visibility callbacks.
   */
  async setPluginEnabled(name: 'moveCells' | 'selectionHandles', enabled: boolean): Promise<void> {
    await this.page.evaluate(({ pluginName, isEnabled }) => {
      // Branch instead of passing the union — the `getPlugin` fixture typing resolves per literal.
      const plugin = pluginName === 'moveCells'
        ? window.hot.getPlugin('moveCells')
        : window.hot.getPlugin('selectionHandles');

      if (isEnabled) {
        plugin.enablePlugin();
      } else {
        plugin.disablePlugin();
      }

      window.hot.render();
    }, { pluginName: name, isEnabled: enabled });
  }

  /**
   * Whether the SelectionHandles plugin reports an active drag.
   */
  async isHandleDragActive(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('selectionHandles').isDragActive());
  }

  /**
   * The cursor the document body currently holds. The drag cursor lives on the body so it persists
   * while the pointer is outside the grid.
   */
  async bodyCursor(): Promise<string> {
    return this.page.evaluate(() => document.body.style.cursor);
  }

  /**
   * Whether the move ghost currently overlaps a cell — the preview must sit over the drop target.
   * A positioning regression pushes the ghost off-screen, so it stops overlapping.
   */
  async isMoveGhostOverCell(row: number, col: number): Promise<boolean> {
    const ghostBox = await this.moveGhost().boundingBox();
    const cellBox = await this.cell(row, col).boundingBox();

    if (!ghostBox || !cellBox) {
      return false;
    }

    return ghostBox.x + ghostBox.width > cellBox.x &&
      ghostBox.x < cellBox.x + cellBox.width &&
      ghostBox.y + ghostBox.height > cellBox.y &&
      ghostBox.y < cellBox.y + cellBox.height;
  }

  /**
   * The move ghost's rendered size, for asserting it spans a whole multi-cell block.
   */
  async moveGhostSize(): Promise<{ width: number, height: number }> {
    const ghostBox = await this.moveGhost().boundingBox();

    if (!ghostBox) {
      throw new Error('The move ghost is not rendered.');
    }

    return { width: ghostBox.width, height: ghostBox.height };
  }

  /**
   * A rendered cell's size, used as the yardstick for ghost-span assertions.
   */
  async cellSize(row: number, col: number): Promise<{ width: number, height: number }> {
    const cellBox = await this.cell(row, col).boundingBox();

    if (!cellBox) {
      throw new Error('The cell is not rendered.');
    }

    return { width: cellBox.width, height: cellBox.height };
  }

  /**
   * Release the active pointer drag.
   */
  async releasePointer(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * Press the centre of the first visible move-zone band.
   */
  async #pressFirstMoveZone(): Promise<void> {
    await this.#pressElementCenter(this.visibleMoveZones().first());
  }

  /**
   * Press the centre of an element with the given mouse button.
   */
  async #pressElementCenter(element: Locator, button: 'left' | 'right' = 'left'): Promise<void> {
    const box = await element.boundingBox();

    if (!box) {
      throw new Error('The target element is not rendered.');
    }

    await this.page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
    await this.page.mouse.down({ button });
  }

  /**
   * Move the pointer to the centre of a rendered cell.
   */
  async #movePointerToCell(row: number, col: number): Promise<void> {
    const box = await this.cell(row, col).boundingBox();

    if (!box) {
      throw new Error('The target cell is not rendered.');
    }

    await this.page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
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
   * The focus (highlight) cell of the last selected range. Resizing must keep it stable when it stays
   * inside the new range, and clamp it into the range when a shrink pushes it out.
   */
  async focusCell(): Promise<{ row: number, col: number }> {
    return this.page.evaluate(() => {
      const highlight = window.hot.getSelectedRangeLast().highlight;

      return { row: highlight.row ?? -1, col: highlight.col ?? -1 };
    });
  }

  /**
   * Normalized bounds for every selection layer, so a resize can be checked not to disturb the others.
   */
  async allSelectedBounds(): Promise<{ top: number, start: number, bottom: number, end: number }[]> {
    return this.page.evaluate(() => window.hot.getSelectedRange().map((range) => {
      const topStart = range.getTopStartCorner();
      const bottomEnd = range.getBottomEndCorner();

      return {
        top: topStart.row ?? -1,
        start: topStart.col ?? -1,
        bottom: bottomEnd.row ?? -1,
        end: bottomEnd.col ?? -1,
      };
    }));
  }

  /** Select several disjoint ranges as separate selection layers. */
  async selectLayers(ranges: [number, number, number, number][]): Promise<void> {
    await this.page.evaluate(layers => window.hot.selectCells(layers), ranges);
  }

  /** Select whole columns through the instance API. */
  async selectColumns(fromCol: number, toCol: number): Promise<void> {
    await this.page.evaluate(([from, to]) => window.hot.selectColumns(from, to), [fromCol, toCol]);
  }

  /**
   * Drag a selection handle onto a cell without releasing, so mid-drag state can be asserted.
   */
  async startHandleDragOverCell(
    edge: 'top' | 'bottom' | 'start' | 'end', row: number, col: number,
  ): Promise<void> {
    await this.#pressElementCenter(this.handle(edge));
    await this.#movePointerToCell(row, col);
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

  /** Hover a cell rendered by the bottom frozen overlay. */
  async hoverFrozenBottomCell(row: number, col: number): Promise<void> {
    await this.page.locator('.ht_clone_bottom').getByTestId(`cell-${row}-${col}`).hover();
  }

  /**
   * The visible selection-adjust handle for an edge, scoped to the master
   * overlay. Every border instance (focus, area, fill) owns a full handle set,
   * so the non-visible duplicates are filtered out to keep the locator strict.
   */
  handle(edge: 'top' | 'bottom' | 'start' | 'end'): Locator {
    return this.page.locator(`.ht_master .wtSelectionHandle--${edge}:visible`);
  }

  /**
   * The visible selection-adjust handle for an edge, scoped to the bottom frozen overlay — a
   * selection inside the bottom frozen pane renders its border (and handles) on that clone,
   * not on the master.
   */
  frozenBottomHandle(edge: 'top' | 'bottom' | 'start' | 'end'): Locator {
    return this.page.locator(`.ht_clone_bottom .wtSelectionHandle--${edge}:visible`);
  }

  /** The currently visible selection-adjust handles in the master overlay. */
  visibleHandles(): Locator {
    return this.page.locator('.ht_master .wtSelectionHandle:visible');
  }

  /** The currently visible move-zone bands in the master overlay. */
  visibleMoveZones(): Locator {
    return this.page.locator('.ht_master .wtMoveZone:visible');
  }

  /** The autofill fill handle of the focus selection, scoped to the master overlay. */
  fillHandle(): Locator {
    return this.page.locator('.ht_master .wtBorder.current.corner:visible');
  }

  /**
   * The fill handle drawn by the frozen-columns overlay — a selection ending inside that pane is
   * rendered by the clone, not by the master.
   */
  frozenColumnsFillHandle(): Locator {
    return this.page.locator('.ht_clone_inline_start .wtBorder.current.corner:visible');
  }

  /** The fill handle drawn by the frozen top-rows overlay. */
  frozenTopFillHandle(): Locator {
    return this.page.locator('.ht_clone_top .wtBorder.current.corner:visible');
  }

  /**
   * How far a frozen overlay's own fill handle sticks out past the edge that clips it, in pixels.
   * The clipping box is the overlay's `.wtHolder` (`overflow: hidden`), not the clone element, which
   * is `overflow: visible` and ends a few pixels earlier — measuring the clone reports an overhang
   * that is not actually cut off.
   */
  async frozenFillHandleOverflow(pane: 'columns' | 'rows'): Promise<number> {
    return this.page.evaluate((targetPane) => {
      const overlaySelector = targetPane === 'columns' ? '.ht_clone_inline_start' : '.ht_clone_top';
      const clippingBox = document.querySelector(`${overlaySelector} .wtHolder`);
      const handle = document.querySelector(`${overlaySelector} .wtBorder.current.corner`);

      if (!clippingBox || !handle) {
        throw new Error(`No fill handle is rendered by "${overlaySelector}".`);
      }

      const clippingRect = clippingBox.getBoundingClientRect();
      const handleRect = handle.getBoundingClientRect();

      return targetPane === 'columns'
        ? handleRect.right - clippingRect.right
        : handleRect.bottom - clippingRect.bottom;
    }, pane);
  }

  /**
   * The stacking order the selection affordances resolve to. `.ht_master` declares no z-index, so
   * it opens no stacking context and its borders compete directly with the overlay clones — which
   * is why the frozen pane's own z-index belongs in the same reading.
   */
  async selectionStackOrder(): Promise<{
    moveZone: number, fillHandle: number, resizeHandle: number, frozenColumnsPane: number,
  }> {
    return this.page.evaluate(() => {
      const zIndexOf = (selector: string) => {
        const element = document.querySelector(selector);

        if (!element) {
          throw new Error(`No element matched "${selector}".`);
        }

        return parseInt(window.getComputedStyle(element).zIndex, 10);
      };

      return {
        moveZone: zIndexOf('.ht_master .wtMoveZone'),
        fillHandle: zIndexOf('.ht_master .wtBorder.current.corner'),
        resizeHandle: zIndexOf('.ht_master .wtSelectionHandle'),
        frozenColumnsPane: zIndexOf('.ht_clone_inline_start'),
      };
    });
  }

  /**
   * Scroll the master viewport until the given cell's trailing edge sits just inside a frozen pane,
   * which is where its fill handle is drawn. Stopping a fixed few pixels past the pane's edge rather
   * than at its middle keeps the cell inside the rendered range in every theme, whatever its column
   * widths and row heights are — a cell scrolled clean out of that range drops its handle entirely
   * and leaves nothing to assert on.
   */
  async scrollCellBehindFrozenPane(row: number, col: number, pane: 'columns' | 'rows'): Promise<void> {
    const paneInset = 8;

    await this.page.evaluate(({ targetRow, targetCol, targetPane, inset }) => {
      const holder = document.querySelector('.ht_master .wtHolder');
      const cell = document.querySelector(`.ht_master [data-testid="cell-${targetRow}-${targetCol}"]`);
      const paneElement = document.querySelector(
        targetPane === 'columns' ? '.ht_clone_inline_start' : '.ht_clone_bottom'
      );

      if (!holder || !cell || !paneElement) {
        throw new Error('The master viewport, the target cell or the frozen pane is not rendered.');
      }

      const cellRect = cell.getBoundingClientRect();
      const paneRect = paneElement.getBoundingClientRect();

      if (targetPane === 'columns') {
        holder.scrollLeft += cellRect.right - (paneRect.right - inset);
      } else {
        holder.scrollTop += cellRect.bottom - (paneRect.top + inset);
      }
    }, { targetRow: row, targetCol: col, targetPane: pane, inset: paneInset });
  }

  /**
   * What the browser hit-tests at the center of the fill handle, as `<overlay>/<class name>`. A
   * frozen pane that occludes the handle owns those pixels, so the topmost element there belongs to
   * that pane rather than to the master. Match on the overlay and treat the class name as detail:
   * which of the pane's elements is topmost at that point depends on the theme's cell metrics.
   */
  async elementAtFillHandleCenter(): Promise<string> {
    const handleBox = await this.fillHandle().boundingBox();

    if (!handleBox) {
      throw new Error('The fill handle is not rendered.');
    }

    return this.page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);

      if (!element) {
        return 'none/none';
      }

      const overlay = element.closest('[class*="ht_clone_"], .ht_master');
      const overlayName = overlay
        ? Array.from(overlay.classList).find(name => name.startsWith('ht_')) : 'none';

      return `${overlayName}/${element.className}`;
    }, { x: handleBox.x + (handleBox.width / 2), y: handleBox.y + (handleBox.height / 2) });
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
