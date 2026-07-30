import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';
import type CellRange from '../../3rdparty/walkontable/src/cell/range';
import { BasePlugin } from '../base';
import { addClass, removeClass } from '../../helpers/dom/element';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { buildMoveMap, clampMoveTarget } from './helpers';

export const PLUGIN_KEY = 'moveCells';
export const PLUGIN_PRIORITY = 25;

const MOVABLE_META_KEYS: ReadonlyArray<string> = ['className'];

/**
 * Provides drag-to-move and programmatic move/copy operations for cell selections.
 */
export class MoveCells extends BasePlugin {
  /**
   *
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   *
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   *
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY];
  }

  /**
   *
   */
  #drag: {
    fromRow: number;
    toRow: number;
    fromCol: number;
    toCol: number;
    grabRowOffset: number;
    grabColOffset: number;
  } | null = null;

  /**
   *
   */
  #ghost: HTMLElement | null = null;

  /**
   *
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
   * Moves or copies a visual cell range.
   *
   * @param {CellRange} sourceRange The source range.
   * @param {CellCoords} targetTopLeft The destination top-left cell.
   * @param {boolean} [isCopy=false] Whether to keep the source values.
   * @returns {boolean} Whether the operation completed.
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

    if (
      targetRow < 0 || targetCol < 0 ||
      targetBottom >= this.hot.countRows() || targetRight >= this.hot.countCols() ||
      this.#hasReadOnlyCell(targetRow, targetCol, height, width)
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
      const moveMap = buildMoveMap({ fromRow, fromCol, toRow, toCol, targetRow, targetCol });
      const snapshots = moveMap.map(({ fromRow: row, fromCol: col }) => this.#readMeta(row, col));
      const targetKeys = new Set(moveMap.map(({ toRow: row, toCol: col }) => `${row}:${col}`));

      moveMap.forEach(({
        fromRow: sourceRow, fromCol: sourceCol, toRow: destinationRow, toCol: destinationCol
      }, index) => {
        this.#writeMeta(destinationRow, destinationCol, snapshots[index]);

        if (!isCopy && !targetKeys.has(`${sourceRow}:${sourceCol}`)) {
          MOVABLE_META_KEYS.forEach(key => this.hot.removeCellMeta(sourceRow, sourceCol, key));
        }
      });

      if (!formulasActive) {
        if (!isCopy) {
          const empty = Array.from({ length: height }, () => Array<null>(width).fill(null));

          this.hot.populateFromArray(fromRow, fromCol, empty, toRow, toCol, 'auto');
        }

        this.hot.populateFromArray(targetRow, targetCol, values, targetBottom, targetRight, 'auto');
      }
    });

    this.hot.selectCells([[targetRow, targetCol, targetBottom, targetRight]]);
    const targetRange = this.hot._createCellRange(
      this.hot._createCellCoords(targetRow, targetCol),
      this.hot._createCellCoords(targetRow, targetCol),
      this.hot._createCellCoords(targetBottom, targetRight),
    );

    this.hot.runHooks('afterMoveCells', sourceRange, targetRange, isCopy);

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
    };
    this.#pointerPosition = { clientX: event.clientX, clientY: event.clientY };
    this.#bodyCursor = this.hot.rootDocument.body.style.cursor;
    this.hot.rootDocument.body.style.cursor = 'grabbing';
    addClass(this.hot.rootElement, 'ht__moving');
    this.#createGhost();
    this.#positionGhost(fromRow, fromCol, toRow, toCol);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mousemove', this.#onMouseMove);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mouseup', this.#onMouseUp);
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'keydown', this.#onKeyDown);
  };

  /**
   * Updates the preview while moving a selection.
   */
  #onMouseMove = (event: Event): void => {
    const mouseEvent = event as MouseEvent;

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
   * Cancels a drag on Escape.
   */
  #onKeyDown = (event: Event): void => {
    if ((event as KeyboardEvent).key === 'Escape') {
      this.#endDrag(false, null);
    }
  };

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
    this.eventManager.removeEventListener(this.hot.rootDocument.documentElement, 'keydown', this.#onKeyDown);
    this.#ghost?.remove();
    this.#ghost = null;
    removeClass(this.hot.rootElement, 'ht__moving');
    this.hot.rootDocument.body.style.cursor = this.#bodyCursor;

    if (!commit || !event) {
      return;
    }

    const pointer = getCellCoordsFromMousePosition(this.hot, event.clientX, event.clientY);
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
   */
  #createGhost(): void {
    const ghost = this.hot.rootDocument.createElement('div');
    const style = this.hot.rootWindow.getComputedStyle(this.hot.rootElement);

    ghost.className = 'wtMoveGhost';
    ghost.style.cssText = `position:fixed;display:none;pointer-events:none;z-index:10000;box-sizing:border-box;border:${
      style.getPropertyValue('--ht-cell-selection-border-width').trim() || '1px'
    } dashed ${style.getPropertyValue('--ht-cell-selection-border-color').trim() || '#4b89ff'};`;
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
   * Checks whether a target range contains a read-only cell.
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
   * Captures movable own cell metadata.
   */
  #readMeta(row: number, col: number): Record<string, unknown> {
    const meta = this.hot.getCellMeta(row, col) as Record<string, unknown>;

    return MOVABLE_META_KEYS.reduce<Record<string, unknown>>((snapshot, key) => {
      if (Object.prototype.hasOwnProperty.call(meta, key)) {
        snapshot[key] = meta[key];
      }

      return snapshot;
    }, {});
  }

  /**
   * Replaces the movable metadata at a target cell.
   */
  #writeMeta(row: number, col: number, meta: Record<string, unknown>): void {
    MOVABLE_META_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(meta, key)) {
        this.hot.setCellMeta(row, col, key, meta[key]);
      } else {
        this.hot.removeCellMeta(row, col, key);
      }
    });
  }
}
