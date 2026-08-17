import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import type CellRange from '../../3rdparty/walkontable/src/cell/range';
import { BasePlugin } from '../base';
import { addClass, removeClass } from '../../helpers/dom/element';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { isRightClick } from '../../helpers/dom/event';
import { warn } from '../../helpers/console';
import { hasOwnProperty } from '../../helpers/object';
import { clampMoveTarget } from './helpers';
import { collectMovableMeta, MOVABLE_META_KEYS } from '../../utils/movableMeta';

export const PLUGIN_KEY = 'moveCells';
export const PLUGIN_PRIORITY = 25;

const SHORTCUTS_GROUP = PLUGIN_KEY;

/**
 * Ceiling on the number of cells one move or copy may span. `moveCellRange` makes roughly six full
 * passes over the source and target regions before anything changes (two read-only scans, two
 * movable-meta collections, the value snapshot, plus the UndoRedo plugin's two region snapshots),
 * and the undo stack retains two whole value matrices — so an unbounded range freezes the tab.
 * The drag path cannot produce a range anywhere near this size; the ceiling protects the public
 * `moveCellRange` API called with a programmatically built range.
 */
export const CELLS_LIMIT = 100000;

// Used only when the theme tokens cannot be resolved (the ghost lives outside the theme scope —
// see `#createGhost`). Mirrors the `main` theme's selection border.
const GHOST_BORDER_WIDTH = '1px';
const GHOST_BORDER_COLOR = '#4b89ff';

/**
 * Provides drag-to-move and programmatic move/copy operations for cell selections.
 */
export class MoveCells extends BasePlugin {
  /**
   * The plugin's registration key (the name of the setting that enables it).
   *
   * @returns {string}
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * The plugin's initialization priority within the plugin registry.
   *
   * @returns {number}
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * The settings whose change through `updateSettings` triggers `updatePlugin`.
   *
   * @returns {string[]}
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY];
  }

  /**
   * State of the drag in progress: the source range corners in visual coordinates, the offset of
   * the grabbed cell from the range's top-start corner (keeps the block anchored under the pointer
   * while dragging), and the cell the press resolved to (used to tell a plain click from a drag on
   * release). `null` when no drag is active.
   */
  #drag: {
    fromRow: number;
    toRow: number;
    fromCol: number;
    toCol: number;
    grabRowOffset: number;
    grabColOffset: number;
    pressRow: number | null;
    pressCol: number | null;
  } | null = null;

  /**
   * The drag preview element — a dashed outline of the block appended to `document.body`
   * (see `#createGhost` for why it lives outside the grid root). `null` when no drag is active.
   */
  #ghost: HTMLElement | null = null;

  /**
   * The `document.body` inline cursor captured when a drag starts, restored when the drag ends.
   */
  #bodyCursor = '';

  /**
   * Stores the latest pointer position so scrolling can refresh the drag preview.
   */
  #pointerPosition: { clientX: number; clientY: number } | null = null;

  /**
   * Checks whether the plugin is enabled in the Handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this.hot.getSettings()[PLUGIN_KEY] === true;
  }

  /**
   * Enables selection move interactions.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.addHook('afterOnSelectionEdgeMouseDown', this.#onSelectionEdgeMouseDown);
    this.addHook('afterScroll', this.#onAfterScroll);
    this.#registerShortcuts();
    super.enablePlugin();
  }

  /**
   * Updates the plugin after its setting changes.
   */
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();
    super.updatePlugin();
  }

  /**
   * Disables selection move interactions and cancels an active drag.
   */
  disablePlugin(): void {
    this.#unregisterShortcuts();
    super.disablePlugin();
    this.#endDrag(false, null);
  }

  /**
   * Destroys the plugin and removes any active drag preview.
   */
  destroy(): void {
    this.#endDrag(false, null);
    super.destroy();
  }

  /**
   * Checks whether a move drag is currently in progress. Reachable through `getPlugin` because
   * DragToScroll needs it — it must not start auto-scrolling for a press this plugin rejected — but
   * internal, not part of the public API.
   *
   * @private
   * @returns {boolean}
   */
  isDragActive(): boolean {
    return this.#drag !== null;
  }

  /**
   * Moves or copies a visual cell range.
   *
   * @param {CellRange} sourceRange The source range.
   * @param {CellCoords} targetTopLeft The destination top-left cell.
   * @param {boolean} [isCopy=false] Whether to keep the source values.
   * @returns {boolean} Whether the operation completed. Returns `false` when the target equals the
   * source top-left (a no-op — no hook fires and no undo entry is recorded), when the range spans
   * more than {@link CELLS_LIMIT} cells, or when any other guard vetoes the operation.
   */
  moveCellRange(sourceRange: CellRange, targetTopLeft: CellCoords, isCopy = false): boolean {
    const sourceStart = sourceRange.getTopStartCorner();
    const sourceEnd = sourceRange.getBottomEndCorner();
    const fromRow = sourceStart.row!;
    const fromCol = sourceStart.col!;
    const toRow = sourceEnd.row!;
    const toCol = sourceEnd.col!;
    const height = toRow - fromRow + 1;
    const width = toCol - fromCol + 1;
    const targetRow = targetTopLeft.row!;
    const targetCol = targetTopLeft.col!;
    const targetBottom = targetRow + height - 1;
    const targetRight = targetCol + width - 1;

    // A move (or copy) onto itself is a no-op. Without this guard a plain click on the move zone
    // — mousedown and mouseup on the same cell — would run the whole commit pipeline for zero data
    // change: a HyperFormula mutation, a rewrite of the source region, and an undo entry that
    // pushes the user's real edits out of the undo stack. Bail before any hook fires so neither
    // UndoRedo nor Formulas snapshot anything.
    if (targetRow === fromRow && targetCol === fromCol) {
      return false;
    }

    // Bail before the region scans below (and before any hook lets UndoRedo snapshot the regions)
    // — see the `CELLS_LIMIT` doc for the cost model.
    if (height * width > CELLS_LIMIT) {
      warn(`The moved range spans more than ${CELLS_LIMIT} cells — the operation was skipped.`);

      return false;
    }

    // A read-only cell vetoes the move from either end. The target case is the obvious one; the
    // source case matters just as much, because `populateFromArray` skips read-only cells (see
    // `core.ts`, which exempts only `'UndoRedo.undo'`). Without this check the source values survive
    // and the move silently degrades into a copy — and with the Formulas plugin active it is worse
    // still: HyperFormula has already relocated the cell, so the engine and the data source diverge.
    // The source bounds matter for the public `moveCellRange` API: the drag path always hands over
    // a real selection, but a caller-built range past the grid edge would read `undefined` off the
    // end of the data source and write it into the target instead of failing cleanly.
    if (
      targetRow < 0 || targetCol < 0 ||
      targetBottom >= this.hot.countRows() || targetRight >= this.hot.countCols() ||
      fromRow < 0 || fromCol < 0 ||
      toRow >= this.hot.countRows() || toCol >= this.hot.countCols() ||
      this.#hasReadOnlyCell(targetRow, targetCol, height, width) ||
      (!isCopy && this.#hasReadOnlyCell(fromRow, fromCol, height, width))
    ) {
      return false;
    }

    const mergeCells = this.hot.getPlugin('mergeCells');

    if (mergeCells?.enabled) {
      const targetRange = this.hot._createCellRange(
        this.hot._createCellCoords(targetRow, targetCol),
        this.hot._createCellCoords(targetRow, targetCol),
        this.hot._createCellCoords(targetBottom, targetRight),
      );

      if (mergeCells.mergedCellsCollection.getWithinRange(sourceRange, true).length > 0 ||
          mergeCells.mergedCellsCollection.getWithinRange(targetRange, true).length > 0) {
        return false;
      }
    }

    if (this.hot.runHooks('beforeMoveCells', sourceRange, targetTopLeft, isCopy) === false) {
      return false;
    }

    const formulas = this.hot.getPlugin('formulas');
    const formulasActive = formulas?.enabled === true;

    if (formulasActive && !formulas.commitPendingMoveCells()) {
      return false;
    }

    const values = this.#getSourceValues(fromRow, fromCol, toRow, toCol);

    this.hot.batch(() => {
      this.#transferMovableMeta({ fromRow, fromCol, toRow, toCol, targetRow, targetCol, isCopy });

      if (!formulasActive) {
        if (!isCopy) {
          const empty = Array.from({ length: height }, () => Array<null>(width).fill(null));

          this.hot.populateFromArray(fromRow, fromCol, empty, toRow, toCol, 'auto');
        }

        this.hot.populateFromArray(targetRow, targetCol, values, targetBottom, targetRight, 'auto');
      }
    });

    const targetRange = this.hot._createCellRange(
      this.hot._createCellCoords(targetRow, targetCol),
      this.hot._createCellCoords(targetRow, targetCol),
      this.hot._createCellCoords(targetBottom, targetRight),
    );

    // `afterMoveCells` must run BEFORE the target is selected. With the Formulas plugin active this
    // hook is where the HOT data source is brought back in line with HyperFormula, which has already
    // relocated the cells — so selecting first made `afterSelection` listeners read the stale
    // pre-move value at the target. UndoRedo's listener works off the `beforeMoveCells` snapshots
    // rather than the selection, so nothing needs the target selected while the hook runs.
    this.hot.runHooks('afterMoveCells', sourceRange, targetRange, isCopy);
    this.hot.selectCells([[targetRow, targetCol, targetBottom, targetRight]]);

    return true;
  }

  /**
   * Reads untransformed source values in the range's current visual order.
   *
   * @param {number} fromRow The visual top row.
   * @param {number} fromCol The visual start column.
   * @param {number} toRow The visual bottom row.
   * @param {number} toCol The visual end column.
   * @returns {Array[]}
   */
  #getSourceValues(fromRow: number, fromCol: number, toRow: number, toCol: number): unknown[][] {
    const values: unknown[][] = [];

    for (let row = fromRow; row <= toRow; row++) {
      const physicalRow = this.hot.toPhysicalRow(row);
      const rowValues: unknown[] = [];

      for (let col = fromCol; col <= toCol; col++) {
        rowValues.push(this.hot.getSourceDataAtCell(physicalRow, col));
      }

      values.push(rowValues);
    }

    return values;
  }

  /**
   * Handles selection edge presses.
   */
  #onSelectionEdgeMouseDown = (event: MouseEvent): void => {
    const selection = this.hot.selection;

    // A right-press opens the context menu; it must not also start (and on release, commit) a move.
    if (isRightClick(event)) {
      return;
    }

    if (this.#drag || (!selection.isRangeMovable() && !selection.isSingleCellMovable())) {
      return;
    }

    const range = selection.getSelectedRange().current();

    if (!range) {
      return;
    }

    const start = range.getTopStartCorner();
    const end = range.getBottomEndCorner();
    const pointer = getCellCoordsFromMousePosition(this.hot, event.clientX, event.clientY);
    const fromRow = start.row!;
    const fromCol = start.col!;
    const toRow = end.row!;
    const toCol = end.col!;

    this.#drag = {
      fromRow,
      fromCol,
      toRow,
      toCol,
      grabRowOffset: Math.min(toRow - fromRow, Math.max(0, (pointer.row ?? fromRow) - fromRow)),
      grabColOffset: Math.min(toCol - fromCol, Math.max(0, (pointer.col ?? fromCol) - fromCol)),
      pressRow: pointer.row,
      pressCol: pointer.col,
    };
    this.#pointerPosition = { clientX: event.clientX, clientY: event.clientY };
    this.#bodyCursor = this.hot.rootDocument.body.style.cursor;
    this.hot.rootDocument.body.style.cursor = 'grabbing';
    addClass(this.hot.rootElement, 'ht__moving');
    this.#createGhost();
    this.#positionGhost(fromRow, fromCol, toRow, toCol);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mousemove', this.#onMouseMove);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mouseup', this.#onMouseUp);
  };

  /**
   * Updates the preview while moving a selection.
   */
  #onMouseMove = (event: Event): void => {
    // Cross-realm safe: the grid may live in an iframe, where the event's `MouseEvent` constructor
    // is the child realm's, not this one's. Matches the narrowing in the SelectionHandles plugin.
    if (!(event instanceof this.hot.rootWindow.MouseEvent)) {
      return;
    }

    const mouseEvent = event;

    if (!this.#drag) {
      return;
    }

    this.#pointerPosition = { clientX: mouseEvent.clientX, clientY: mouseEvent.clientY };
    this.#updateDragPreview(mouseEvent.clientX, mouseEvent.clientY);
  };

  /**
   * Refreshes the preview after DragToScroll changes the rendered viewport.
   */
  #onAfterScroll = (): void => {
    if (this.#drag && this.#pointerPosition) {
      this.#updateDragPreview(this.#pointerPosition.clientX, this.#pointerPosition.clientY);
    }
  };

  /**
   * Positions the preview for the current pointer coordinates.
   *
   * @param {number} clientX The pointer's viewport X coordinate.
   * @param {number} clientY The pointer's viewport Y coordinate.
   */
  #updateDragPreview(clientX: number, clientY: number): void {
    const drag = this.#drag;

    if (!drag) {
      return;
    }

    const { fromRow, fromCol, toRow, toCol, grabRowOffset, grabColOffset } = drag;
    const pointer = getCellCoordsFromMousePosition(this.hot, clientX, clientY);
    const target = clampMoveTarget({
      pointerRow: pointer.row ?? fromRow,
      pointerCol: pointer.col ?? fromCol,
      grabRowOffset,
      grabColOffset,
      rangeHeight: toRow - fromRow + 1,
      rangeWidth: toCol - fromCol + 1,
      totalRows: this.hot.countRows(),
      totalCols: this.hot.countCols(),
    });

    this.#positionGhost(target.row, target.col, target.row + toRow - fromRow, target.col + toCol - fromCol);
  }

  /**
   * Commits a drag on mouse release.
   */
  #onMouseUp = (event: Event): void => {
    this.#endDrag(true, event as MouseEvent);
  };

  /**
   * Registers the shortcut that cancels an active drag on Escape. Registered once for the
   * plugin's lifetime and gated by `runOnlyIf`, so it stays inert while no drag is in progress.
   */
  #registerShortcuts(): void {
    this.hot.getShortcutManager().getContext('grid')?.addShortcut({
      keys: [['Escape']],
      callback: () => this.#endDrag(false, null),
      runOnlyIf: () => this.#drag !== null,
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregisters the plugin's shortcuts.
   */
  #unregisterShortcuts(): void {
    this.hot.getShortcutManager().getContext('grid')?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Ends the active drag and optionally performs the move.
   */
  #endDrag(commit: boolean, event: MouseEvent | null): void {
    const drag = this.#drag;

    if (!drag) {
      return;
    }

    this.#drag = null;
    this.#pointerPosition = null;
    this.eventManager.removeEventListener(this.hot.rootDocument.documentElement, 'mousemove', this.#onMouseMove);
    this.eventManager.removeEventListener(this.hot.rootDocument.documentElement, 'mouseup', this.#onMouseUp);
    this.#ghost?.remove();
    this.#ghost = null;
    removeClass(this.hot.rootElement, 'ht__moving');
    this.hot.rootDocument.body.style.cursor = this.#bodyCursor;

    if (!commit || !event) {
      return;
    }

    const pointer = getCellCoordsFromMousePosition(this.hot, event.clientX, event.clientY);

    // A gesture that starts and ends in the same cell is a click, not a move. The move bands
    // straddle the selection border, so a press can resolve to the cell just OUTSIDE the range —
    // committing there would shift the block by one cell on a plain click (and on macOS a
    // Ctrl+click would commit a spurious copy the same way). The band swallowed the mousedown
    // (`stopImmediatePropagation` + `preventDefault`), so the usual click-to-select never ran —
    // select the cell under the pointer here, exactly as an unswallowed click would have.
    if (pointer.row === drag.pressRow && pointer.col === drag.pressCol) {
      if (pointer.row !== null && pointer.col !== null) {
        this.hot.selectCell(pointer.row, pointer.col);
      }

      return;
    }

    const target = clampMoveTarget({
      pointerRow: pointer.row ?? drag.fromRow,
      pointerCol: pointer.col ?? drag.fromCol,
      grabRowOffset: drag.grabRowOffset,
      grabColOffset: drag.grabColOffset,
      rangeHeight: drag.toRow - drag.fromRow + 1,
      rangeWidth: drag.toCol - drag.fromCol + 1,
      totalRows: this.hot.countRows(),
      totalCols: this.hot.countCols(),
    });
    const source = this.hot._createCellRange(
      this.hot._createCellCoords(drag.fromRow, drag.fromCol),
      this.hot._createCellCoords(drag.fromRow, drag.fromCol),
      this.hot._createCellCoords(drag.toRow, drag.toCol),
    );

    this.moveCellRange(source, this.hot._createCellCoords(target.row, target.col), event.ctrlKey || event.metaKey);
  }

  /**
   * Creates the drag preview element.
   *
   * The ghost is appended to `document.body` with `position: fixed` so a host layout's overflow can
   * never clip it. That puts it outside the theme scope, where the `--ht-cell-selection-border-*`
   * tokens do not resolve — so the two theme-derived values are read off the root element and
   * inlined here rather than declared in `_selection.scss` (which documents the same constraint).
   */
  #createGhost(): void {
    const ghost = this.hot.rootDocument.createElement('div');
    const rootStyle = this.hot.rootWindow.getComputedStyle(this.hot.rootElement);
    const borderWidth = rootStyle.getPropertyValue('--ht-cell-selection-border-width').trim() || GHOST_BORDER_WIDTH;
    const borderColor = rootStyle.getPropertyValue('--ht-cell-selection-border-color').trim() || GHOST_BORDER_COLOR;

    ghost.className = 'wtMoveGhost';
    Object.assign(ghost.style, {
      position: 'fixed',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '10000',
      boxSizing: 'border-box',
      border: `${borderWidth} dashed ${borderColor}`,
    });
    this.hot.rootDocument.body.appendChild(ghost);
    this.#ghost = ghost;
  }

  /**
   * Positions the drag preview over the rendered portion of a visual range.
   */
  #positionGhost(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    if (!this.#ghost) {
      return;
    }

    const firstRow = this.hot.rowIndexMapper.getNearestNotHiddenIndex(
      Math.max(fromRow, this.hot.getFirstRenderedVisibleRow()),
      1,
    );
    const lastRow = this.hot.rowIndexMapper.getNearestNotHiddenIndex(
      Math.min(toRow, this.hot.getLastRenderedVisibleRow()),
      -1,
    );
    const firstCol = this.hot.columnIndexMapper.getNearestNotHiddenIndex(
      Math.max(fromCol, this.hot.getFirstRenderedVisibleColumn()),
      1,
    );
    const lastCol = this.hot.columnIndexMapper.getNearestNotHiddenIndex(
      Math.min(toCol, this.hot.getLastRenderedVisibleColumn()),
      -1,
    );

    if (firstRow === null || lastRow === null || firstCol === null || lastCol === null ||
      firstRow > lastRow || firstCol > lastCol || firstRow > toRow || lastRow < fromRow ||
      firstCol > toCol || lastCol < fromCol) {
      this.#ghost.style.display = 'none';

      return;
    }

    const first = this.hot.getCell(firstRow, firstCol, true);
    const last = this.hot.getCell(lastRow, lastCol, true);

    if (!first || !last) {
      this.#ghost.style.display = 'none';

      return;
    }

    const firstRect = first.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();
    const left = Math.min(firstRect.left, lastRect.left);
    const right = Math.max(firstRect.right, lastRect.right);

    Object.assign(this.#ghost.style, {
      display: 'block',
      top: `${firstRect.top}px`,
      left: `${left}px`,
      width: `${right - left}px`,
      height: `${lastRect.bottom - firstRect.top}px`,
    });
  }

  /**
   * Checks whether a range contains a read-only cell. Used for both the source and the target range.
   */
  #hasReadOnlyCell(row: number, col: number, height: number, width: number): boolean {
    for (let rowOffset = 0; rowOffset < height; rowOffset++) {
      for (let colOffset = 0; colOffset < width; colOffset++) {
        if (this.hot.getCellMetaTransient(row + rowOffset, col + colOffset).readOnly) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Moves the movable cell meta of the source region onto the target region. Works sparsely: both
   * regions are scanned transiently up front (they may overlap, so all reads happen before any
   * write), and only cells that carry an own movable key produce a `setCellMeta`/`removeCellMeta`
   * call. Moving an unstyled block therefore materializes no cell meta at all — a dense per-cell
   * write over a large target region is exactly the O(visited cells) retention pattern the meta
   * layer documentation forbids.
   */
  #transferMovableMeta({ fromRow, fromCol, toRow, toCol, targetRow, targetCol, isCopy }: {
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    targetRow: number;
    targetCol: number;
    isCopy: boolean;
  }): void {
    const rowDelta = targetRow - fromRow;
    const colDelta = targetCol - fromCol;
    const targetBottom = targetRow + (toRow - fromRow);
    const targetRight = targetCol + (toCol - fromCol);
    const sourceMeta = collectMovableMeta(this.hot, fromRow, fromCol, toRow, toCol);
    const targetMeta = collectMovableMeta(this.hot, targetRow, targetCol, targetBottom, targetRight);
    const sourceByCoord = new Map(sourceMeta.map(({ row, col, meta }) => [`${row}:${col}`, meta]));

    sourceMeta.forEach(({ row, col, meta }) => {
      MOVABLE_META_KEYS.forEach((key) => {
        if (hasOwnProperty(meta, key)) {
          this.hot.setCellMeta(row + rowDelta, col + colDelta, key, meta[key]);
        }
      });
    });

    // Clear the movable keys the target region carried before the move, unless the incoming
    // source cell just wrote that key over them.
    targetMeta.forEach(({ row, col, meta }) => {
      const incoming = sourceByCoord.get(`${row - rowDelta}:${col - colDelta}`);

      MOVABLE_META_KEYS.forEach((key) => {
        if (hasOwnProperty(meta, key) && !(incoming && hasOwnProperty(incoming, key))) {
          this.hot.removeCellMeta(row, col, key);
        }
      });
    });

    if (isCopy) {
      return;
    }

    // A moved (not copied) cell leaves its meta behind — unless it sits inside the target region,
    // where the write pass above has already decided its final state.
    sourceMeta.forEach(({ row, col }) => {
      const insideTarget = row >= targetRow && row <= targetBottom && col >= targetCol && col <= targetRight;

      if (!insideTarget) {
        MOVABLE_META_KEYS.forEach(key => this.hot.removeCellMeta(row, col, key));
      }
    });
  }
}
