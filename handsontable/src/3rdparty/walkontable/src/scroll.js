import {
  innerHeight,
  innerWidth,
  getScrollLeft,
  getScrollTop,
  offset,
} from '../../../helpers/dom/element';
import {
  createObjectPropListener,
} from '../../../helpers/object';

/**
 * @class Scroll
 */
class Scroll {
  /**
   * The data access object.
   *
   * @protected
   * @type {ScrollDao}
   */
  dataAccessObject;

  /**
   * @param {ScrollDao} dataAccessObject Tha data access object.
   */
  constructor(dataAccessObject) {
    this.dataAccessObject = dataAccessObject;
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
  scrollViewport(coords, horizontalSnap, verticalSnap) {
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
  scrollViewportHorizontally(column, snapping = 'auto') {
    const {
      drawn,
      totalColumns
    } = this.dataAccessObject;

    if (!drawn) {
      return false;
    }

    const snappingObject = createObjectPropListener(snapping);

    column = this.dataAccessObject.wtSettings
      .getSetting('onBeforeViewportScrollHorizontally', column, snappingObject);

    if (!Number.isInteger(column) || column < 0 || column > totalColumns) {
      return false;
    }

    snapping = snappingObject.value;

    const {
      fixedColumnsStart,
      inlineStartOverlay,
    } = this.dataAccessObject;
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
  scrollViewportVertically(row, snapping = 'auto') {
    const {
      drawn,
      totalRows
    } = this.dataAccessObject;

    if (!drawn) {
      return false;
    }

    const snappingObject = createObjectPropListener(snapping);

    row = this.dataAccessObject.wtSettings
      .getSetting('onBeforeViewportScrollVertically', row, snappingObject);

    if (!Number.isInteger(row) || row < 0 || row > totalRows) {
      return false;
    }

    snapping = snappingObject.value;

    const {
      fixedRowsBottom,
      fixedRowsTop,
      topOverlay,
    } = this.dataAccessObject;
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
    return this.dataAccessObject.wtTable.getFirstVisibleRow();
  }

  /**
   * Get last visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastVisibleRow() {
    return this.#getLastRowIndex(this.dataAccessObject.wtTable.getLastVisibleRow());
  }

  /**
   * Get first partially visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstPartiallyVisibleRow() {
    return this.dataAccessObject.wtTable.getFirstPartiallyVisibleRow();
  }

  /**
   * Get last visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastPartiallyVisibleRow() {
    return this.#getLastRowIndex(this.dataAccessObject.wtTable.getLastPartiallyVisibleRow());
  }

  /**
   * Get first visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstVisibleColumn() {
    return this.dataAccessObject.wtTable.getFirstVisibleColumn();
  }

  /**
   * Get last visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastVisibleColumn() {
    return this.#getLastColumnIndex(this.dataAccessObject.wtTable.getLastVisibleColumn());
  }

  /**
   * Get first partially visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstPartiallyVisibleColumn() {
    return this.dataAccessObject.wtTable.getFirstPartiallyVisibleColumn();
  }

  /**
   * Get last partially visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastPartiallyVisibleColumn() {
    return this.#getLastColumnIndex(this.dataAccessObject.wtTable.getLastPartiallyVisibleColumn());
  }

  /**
   * Get last visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @param {number} lastColumnIndex The last visible column index.
   * @returns {number}
   */
  #getLastColumnIndex(lastColumnIndex) {
    const {
      wtSettings,
      inlineStartOverlay,
      wtTable,
      wtViewport,
      totalColumns,
      rootWindow,
    } = this.dataAccessObject;

    if (inlineStartOverlay.mainTableScrollableElement === rootWindow) {
      const isRtl = wtSettings.getSetting('rtlMode');
      let inlineStartRootElementOffset = null;

      if (isRtl) {
        const tableRect = wtTable.TABLE.getBoundingClientRect();
        const rootDocument = this.dataAccessObject.rootWindow.document;
        const docOffsetWidth = rootDocument.documentElement.offsetWidth;

        inlineStartRootElementOffset = Math.abs(tableRect.right - docOffsetWidth);

      } else {
        const rootElementOffset = offset(wtTable.wtRootElement);

        inlineStartRootElementOffset = rootElementOffset.left;
      }

      const windowScrollLeft = Math.abs(getScrollLeft(rootWindow, rootWindow));

      // Only calculate lastColumnIndex when table didn't filled (from right) whole viewport space
      if (inlineStartRootElementOffset > windowScrollLeft) {
        const windowWidth = innerWidth(rootWindow);
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
  #getLastRowIndex(lastRowIndex) {
    const {
      topOverlay,
      wtTable,
      wtViewport,
      totalRows,
      rootWindow,
    } = this.dataAccessObject;

    if (topOverlay.mainTableScrollableElement === rootWindow) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const windowScrollTop = getScrollTop(rootWindow, rootWindow);

      // Only calculate lastRowIndex when table didn't filled (from bottom) whole viewport space
      if (rootElementOffset.top > windowScrollTop) {
        const windowHeight = innerHeight(rootWindow);
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
