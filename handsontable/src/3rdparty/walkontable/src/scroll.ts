
import type { EngineContext } from './wire';
import {
  createObjectPropListener,
} from '../../../helpers/object';

/**
 * Assembles the Scroll module's dependencies from the engine composition context.
 *
 * This factory is the single source of truth for what Scroll depends on: adding or removing a
 * dependency is a one-line edit here, and the `ScrollDeps` type is inferred from the return value,
 * so there is no separate hand-written interface to keep in sync.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The Scroll dependency set.
 */
export function createScrollDeps(ctx: EngineContext) {
  return {
    wtSettings: ctx.wtSettings,
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    isDrawn: ctx.isDrawn,
    getWtTable: ctx.getWtTable,
    getWtViewport: ctx.getWtViewport,
    getTopOverlay: ctx.getTopOverlay,
    getInlineStartOverlay: ctx.getInlineStartOverlay,
  };
}

/**
 * The Scroll module dependencies, inferred from `createScrollDeps`.
 */
export type ScrollDeps = ReturnType<typeof createScrollDeps>;

/**
 * @class Scroll
 */
class Scroll {
  /**
   * The Scroll module dependencies.
   *
   * @type {ScrollDeps}
   */
  #deps: ScrollDeps;

  /**
   * @param {ScrollDeps} deps The Scroll module dependencies.
   */
  constructor(deps: ScrollDeps) {
    this.#deps = deps;
  }

  /**
   * Scrolls viewport to a cell.
   *
   * @param {CellCoords} coords The cell coordinates.
   * @param {'auto' | 'start' | 'end'} [horizontalSnap='auto'] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @param {'auto' | 'top' | 'bottom'} [verticalSnap='auto'] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on the bottom of
   * the table. When `'auto'`, the viewport is scrolled only when the row is outside of the viewport.
   * @returns {boolean}
   */
  scrollViewport(coords: { row: number; col: number }, horizontalSnap: string, verticalSnap: string) {
    if (coords.col < 0 || coords.row < 0) {
      return false;
    }

    const scrolledHorizontally = this.scrollViewportHorizontally(coords.col, horizontalSnap);
    const scrolledVertically = this.scrollViewportVertically(coords.row, verticalSnap);

    return scrolledHorizontally || scrolledVertically;
  }

  /**
   * Scrolls viewport to a column.
   *
   * @param {number} column Visual column index.
   * @param {'auto' | 'start' | 'end'} [snapping='auto'] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @returns {boolean}
   */
  scrollViewportHorizontally(column: number, snapping = 'auto') {
    const { wtSettings } = this.#deps;

    if (!this.#deps.isDrawn()) {
      return false;
    }

    const totalColumns = wtSettings.getSetting<number>('totalColumns');
    const snappingObject = createObjectPropListener(snapping);

    column = wtSettings
      .getSetting<number>('onBeforeViewportScrollHorizontally', column, snappingObject);

    if (!Number.isInteger(column) || column < 0 || column > totalColumns) {
      return false;
    }

    snapping = snappingObject.value as string;

    const fixedColumnsStart = wtSettings.getSetting<number>('fixedColumnsStart');
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const autoSnapping = snapping === 'auto';

    // for auto-snapping do not scroll the viewport when the columns points to the overlays
    if (autoSnapping && column < fixedColumnsStart) {
      return false;
    }

    const firstColumn = this.getFirstVisibleColumn();
    const lastColumn = this.getLastVisibleColumn();
    let result = false;

    if (autoSnapping && (column < firstColumn || column > lastColumn) || !autoSnapping) {
      // if there is at least one fully visible column determine the snapping direction based on
      // that columns or by snapping flag, if provided.
      result = inlineStartOverlay
        .scrollTo(column, autoSnapping ? column >= this.getLastPartiallyVisibleColumn() : snapping === 'end');
    }

    return result;
  }

  /**
   * Scrolls viewport to a row.
   *
   * @param {number} row Visual row index.
   * @param {'auto' | 'top' | 'bottom'} [snapping='auto'] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on
   * the bottom of the table. When `'auto'`, the viewport is scrolled only when the row is outside of
   * the viewport.
   * @returns {boolean}
   */
  scrollViewportVertically(row: number, snapping = 'auto') {
    const { wtSettings } = this.#deps;

    if (!this.#deps.isDrawn()) {
      return false;
    }

    const totalRows = wtSettings.getSetting<number>('totalRows');
    const snappingObject = createObjectPropListener(snapping);

    row = wtSettings
      .getSetting<number>('onBeforeViewportScrollVertically', row, snappingObject);

    if (!Number.isInteger(row) || row < 0 || row > totalRows) {
      return false;
    }

    snapping = snappingObject.value as string;

    const fixedRowsBottom = wtSettings.getSetting<number>('fixedRowsBottom');
    const fixedRowsTop = wtSettings.getSetting<number>('fixedRowsTop');
    const topOverlay = this.#deps.getTopOverlay();
    const autoSnapping = snapping === 'auto';

    // for auto-snapping do not scroll the viewport when the rows points to the overlays
    if (autoSnapping && (row < fixedRowsTop || row > totalRows - fixedRowsBottom - 1)) {
      return false;
    }

    const firstRow = this.getFirstVisibleRow();
    const lastRow = this.getLastVisibleRow();
    let result = false;

    if (autoSnapping && (row < firstRow || row > lastRow) || !autoSnapping) {
      // if there is at least one fully visible row determine the snapping direction based on
      // that rows or by snapping flag, if provided.
      result = topOverlay.scrollTo(
        row,
        autoSnapping ? row >= this.getLastPartiallyVisibleRow() : snapping === 'bottom'
      );
    }

    return result;
  }

  /**
   * Get first visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstVisibleRow() {
    return this.#deps.getWtTable().getFirstVisibleRow();
  }

  /**
   * Get last visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastVisibleRow() {
    return this.#getLastRowIndex(this.#deps.getWtTable().getLastVisibleRow());
  }

  /**
   * Get first partially visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstPartiallyVisibleRow() {
    return this.#deps.getWtTable().getFirstPartiallyVisibleRow();
  }

  /**
   * Get last visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastPartiallyVisibleRow() {
    return this.#getLastRowIndex(this.#deps.getWtTable().getLastPartiallyVisibleRow());
  }

  /**
   * Get first visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstVisibleColumn() {
    return this.#deps.getWtTable().getFirstVisibleColumn();
  }

  /**
   * Get last visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastVisibleColumn() {
    return this.#getLastColumnIndex(this.#deps.getWtTable().getLastVisibleColumn());
  }

  /**
   * Get first partially visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstPartiallyVisibleColumn() {
    return this.#deps.getWtTable().getFirstPartiallyVisibleColumn();
  }

  /**
   * Get last partially visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastPartiallyVisibleColumn() {
    return this.#getLastColumnIndex(this.#deps.getWtTable().getLastPartiallyVisibleColumn());
  }

  /**
   * Get last visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @param {number} lastColumnIndex The last visible column index.
   * @returns {number}
   */
  #getLastColumnIndex(lastColumnIndex: number) {
    const { wtSettings, rootWindow, geometryReader } = this.#deps;
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const wtTable = this.#deps.getWtTable();
    const wtViewport = this.#deps.getWtViewport();
    const totalColumns = wtSettings.getSetting<number>('totalColumns');

    if (inlineStartOverlay.mainTableScrollableElement === rootWindow) {
      const isRtl: boolean = wtSettings.getSetting('rtlMode');
      let inlineStartRootElementOffset = null;

      if (isRtl) {
        const tableRect = geometryReader.getBoundingClientRect(wtTable.TABLE);
        const rootDocument = rootWindow.document;
        const docOffsetWidth = geometryReader.offsetWidth(rootDocument.documentElement);

        inlineStartRootElementOffset = Math.abs(tableRect.right - docOffsetWidth);

      } else {
        const rootElementOffset = geometryReader.offset(wtTable.wtRootElement);

        inlineStartRootElementOffset = rootElementOffset.left;
      }

      const windowScrollLeft = Math.abs(geometryReader.getScrollLeft(rootWindow));

      // Only calculate lastColumnIndex when table didn't filled (from right) whole viewport space
      if (inlineStartRootElementOffset > windowScrollLeft) {
        const windowWidth = geometryReader.innerWidth(rootWindow);
        let columnsWidth = wtViewport.getRowHeaderWidth();

        for (let column = 1; column <= totalColumns; column++) {
          columnsWidth += inlineStartOverlay.sumCellSizes(column - 1, column);

          if (inlineStartRootElementOffset + columnsWidth - windowScrollLeft >= windowWidth) {
            // Return physical column - 1 (-2 because rangeEach gives column index + 1 - sumCellSizes requirements)
            lastColumnIndex = column - 2;
            break;
          }
        }
      }
    }

    return lastColumnIndex;
  }

  /**
   * Get last visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @param {number} lastRowIndex The last visible row index.
   * @returns {number}
   */
  #getLastRowIndex(lastRowIndex: number) {
    const { wtSettings, rootWindow, geometryReader } = this.#deps;
    const topOverlay = this.#deps.getTopOverlay();
    const wtTable = this.#deps.getWtTable();
    const wtViewport = this.#deps.getWtViewport();
    const totalRows = wtSettings.getSetting<number>('totalRows');

    if (topOverlay.mainTableScrollableElement === rootWindow) {
      const rootElementOffset = geometryReader.offset(wtTable.wtRootElement);
      const windowScrollTop = geometryReader.getScrollTop(rootWindow);

      // Only calculate lastRowIndex when table didn't filled (from bottom) whole viewport space
      if (rootElementOffset.top > windowScrollTop) {
        const windowHeight = geometryReader.innerHeight(rootWindow);
        let rowsHeight = wtViewport.getColumnHeaderHeight();

        for (let row = 1; row <= totalRows; row++) {
          rowsHeight += topOverlay.sumCellSizes(row - 1, row);

          if (rootElementOffset.top + rowsHeight - windowScrollTop >= windowHeight) {
            // Return physical row - 1 (-2 because rangeEach gives row index + 1 - sumCellSizes requirements)
            lastRowIndex = row - 2;
            break;
          }
        }
      }
    }

    return lastRowIndex;
  }
}

export default Scroll;
