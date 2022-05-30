import {
  innerHeight,
  innerWidth,
  getScrollLeft,
  getScrollTop,
  offset,
} from '../../../helpers/dom/element';

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
   * Holds the last column the scroll was performed to. It determines scroll snapping (right or left)
   * for the next horizontal scroll API call.
   *
   * @protected
   * @type {number}
   */
  lastScrolledColumnPos = -1;
  /**
   * Holds the last row the scroll was performed to. It determines scroll snapping (top or bottom)
   * for the next vertical scroll API call.
   *
   * @protected
   * @type {number}
   */
  lastScrolledRowPos = -1;

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
   * @param {boolean} [snapToTop] If `true`, viewport is scrolled to show the cell on the top of the table.
   * @param {boolean} [snapToRight] If `true`, viewport is scrolled to show the cell on the right of the table.
   * @param {boolean} [snapToBottom] If `true`, viewport is scrolled to show the cell on the bottom of the table.
   * @param {boolean} [snapToLeft] If `true`, viewport is scrolled to show the cell on the left of the table.
   * @returns {boolean}
   */
  scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft) {
    const scrolledHorizontally = this.scrollViewportHorizontally(coords.col, snapToRight, snapToLeft);
    const scrolledVertically = this.scrollViewportVertically(coords.row, snapToTop, snapToBottom);

    return scrolledHorizontally || scrolledVertically;
  }

  /**
   * Scrolls viewport to a column.
   *
   * @param {number} column Visual column index.
   * @param {boolean} [snapToRight] If `true`, viewport is scrolled to show the cell on the right of the table.
   * @param {boolean} [snapToLeft] If `true`, viewport is scrolled to show the cell on the left of the table.
   * @returns {boolean}
   */
  scrollViewportHorizontally(column, snapToRight, snapToLeft) {
    const {
      drawn,
      totalColumns
    } = this.dataAccessObject;

    // do not scroll the viewport when the column points to a range outside of the dataset
    if (!drawn || (column < 0 && column > totalColumns)) {
      return false;
    }

    const firstVisibleColumn = this.getFirstVisibleColumn();
    const lastVisibleColumn = this.getLastVisibleColumn();
    const {
      fixedColumnsStart,
      inlineStartOverlay,
    } = this.dataAccessObject;

    if (column < fixedColumnsStart) {
      return false;
    }

    const autoSnapping = snapToRight === void 0 && snapToLeft === void 0;
    let result = false;

    // if there is no fully visible columns use the supporting variable (lastScrolledColumnPos) to
    // determine the snapping type (left or right)
    if (firstVisibleColumn === -1) {
      result = inlineStartOverlay
        .scrollTo(column, autoSnapping ? column > this.lastScrolledColumnPos : snapToRight);

    } else if (autoSnapping && (column < firstVisibleColumn || column > lastVisibleColumn) || !autoSnapping) {
      // if there is at least one fully visible column determine the snapping type based on that columns
      // or by snapToRight/snapToLeft flags, if provided.
      result = inlineStartOverlay
        .scrollTo(column, autoSnapping ? column > lastVisibleColumn : snapToRight);
    }

    if (result) {
      this.lastScrolledColumnPos = column;
    }

    return result;
  }

  /**
   * Scrolls viewport to a row.
   *
   * @param {number} row Visual row index.
   * @param {boolean} [snapToTop] If `true`, viewport is scrolled to show the cell on the top of the table.
   * @param {boolean} [snapToBottom] If `true`, viewport is scrolled to show the cell on the bottom of the table.
   * @returns {boolean}
   */
  scrollViewportVertically(row, snapToTop, snapToBottom) {
    const {
      drawn,
      totalRows
    } = this.dataAccessObject;

    // do not scroll the viewport when the row points to a range outside of the dataset
    if (!drawn || (row < 0 && row > totalRows)) {
      return false;
    }

    const firstVisibleRow = this.getFirstVisibleRow();
    const lastVisibleRow = this.getLastVisibleRow();
    const {
      fixedRowsBottom,
      fixedRowsTop,
      topOverlay,
    } = this.dataAccessObject;

    if (row < fixedRowsTop || row > totalRows - fixedRowsBottom) {
      return false;
    }

    const autoSnapping = snapToTop === void 0 && snapToBottom === void 0;
    let result = false;

    // if there is no fully visible rows use the supporting variable (lastScrolledRowPos) to
    // determine the snapping type (top or bottom)
    if (firstVisibleRow === -1) {
      result = topOverlay.scrollTo(row, autoSnapping ? row > this.lastScrolledRowPos : snapToBottom);

    } else if (autoSnapping && (row < firstVisibleRow || row > lastVisibleRow) || !autoSnapping) {
      // if there is at least one fully visible row determine the snapping type based on that rows
      // or by snapToTop/snapToBottom flags, if provided.
      result = topOverlay.scrollTo(row, autoSnapping ? row > lastVisibleRow : snapToBottom);
    }

    if (result) {
      this.lastScrolledRowPos = row;
    }

    return result;
  }

  /**
   * Get first visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstVisibleRow() {
    const {
      topOverlay,
      wtTable,
      wtViewport,
      totalRows,
      fixedRowsTop,
      rootWindow,
    } = this.dataAccessObject;

    let firstVisibleRow = wtTable.getFirstVisibleRow();

    if (topOverlay.mainTableScrollableElement === rootWindow) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const totalTableHeight = innerHeight(wtTable.hider);
      const windowHeight = innerHeight(rootWindow);
      const windowScrollTop = getScrollTop(rootWindow, rootWindow);

      // Only calculate firstVisibleRow when table didn't filled (from up) whole viewport space
      if (rootElementOffset.top + totalTableHeight - windowHeight <= windowScrollTop) {
        let rowsHeight = wtViewport.getColumnHeaderHeight();

        rowsHeight += topOverlay.sumCellSizes(0, fixedRowsTop);

        for (let row = totalRows; row > 0; row--) {
          rowsHeight += topOverlay.sumCellSizes(row - 1, row);

          if (rootElementOffset.top + totalTableHeight - rowsHeight <= windowScrollTop) {
            // Return physical row + 1
            firstVisibleRow = row;
            break;
          }
        }
      }
    }

    return firstVisibleRow;
  }

  /**
   * Get last visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastVisibleRow() {
    const {
      topOverlay,
      wtTable,
      wtViewport,
      totalRows,
      rootWindow,
    } = this.dataAccessObject;
    let lastVisibleRow = wtTable.getLastVisibleRow();

    if (topOverlay.mainTableScrollableElement === rootWindow) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const windowScrollTop = getScrollTop(rootWindow, rootWindow);

      // Only calculate lastVisibleRow when table didn't filled (from bottom) whole viewport space
      if (rootElementOffset.top > windowScrollTop) {
        const windowHeight = innerHeight(rootWindow);
        let rowsHeight = wtViewport.getColumnHeaderHeight();

        for (let row = 1; row <= totalRows; row++) {
          rowsHeight += topOverlay.sumCellSizes(row - 1, row);

          if (rootElementOffset.top + rowsHeight - windowScrollTop >= windowHeight) {
            // Return physical row - 1 (-2 because rangeEach gives row index + 1 - sumCellSizes requirements)
            lastVisibleRow = row - 2;
            break;
          }
        }
      }
    }

    return lastVisibleRow;
  }

  /**
   * Get first visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstVisibleColumn() {
    const {
      inlineStartOverlay,
      wtTable,
      wtViewport,
      totalColumns,
      rootWindow,
    } = this.dataAccessObject;

    let firstVisibleColumn = wtTable.getFirstVisibleColumn();

    if (inlineStartOverlay.mainTableScrollableElement === rootWindow) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const totalTableWidth = innerWidth(wtTable.hider);
      const windowWidth = innerWidth(rootWindow);
      const windowScrollLeft = Math.abs(getScrollLeft(rootWindow, rootWindow));

      // Only calculate firstVisibleColumn when table didn't filled (from left) whole viewport space
      if (rootElementOffset.left + totalTableWidth - windowWidth <= windowScrollLeft) {
        let columnsWidth = wtViewport.getRowHeaderWidth();

        for (let column = totalColumns; column > 0; column--) {
          columnsWidth += inlineStartOverlay.sumCellSizes(column - 1, column);

          if (rootElementOffset.left + totalTableWidth - columnsWidth <= windowScrollLeft) {
            // Return physical column + 1
            firstVisibleColumn = column;
            break;
          }
        }
      }
    }

    return firstVisibleColumn;
  }

  /**
   * Get last visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastVisibleColumn() {
    const {
      inlineStartOverlay,
      wtTable,
      wtViewport,
      totalColumns,
      rootWindow,
    } = this.dataAccessObject;

    let lastVisibleColumn = wtTable.getLastVisibleColumn();

    if (inlineStartOverlay.mainTableScrollableElement === rootWindow) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const windowScrollLeft = Math.abs(getScrollLeft(rootWindow, rootWindow));

      // Only calculate lastVisibleColumn when table didn't filled (from right) whole viewport space
      if (rootElementOffset.left > windowScrollLeft) {
        const windowWidth = innerWidth(rootWindow);
        let columnsWidth = wtViewport.getRowHeaderWidth();

        for (let column = 1; column <= totalColumns; column++) {
          columnsWidth += inlineStartOverlay.sumCellSizes(column - 1, column);

          if (rootElementOffset.left + columnsWidth - windowScrollLeft >= windowWidth) {
            // Return physical column - 1 (-2 because rangeEach gives column index + 1 - sumCellSizes requirements)
            lastVisibleColumn = column - 2;
            break;
          }
        }
      }
    }

    return lastVisibleColumn;
  }
}

export default Scroll;
