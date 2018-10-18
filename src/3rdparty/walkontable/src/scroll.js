import {
  innerHeight,
  innerWidth,
  getScrollLeft,
  getScrollTop,
  offset,
} from './../../../helpers/dom/element';
import { rangeEach, rangeEachReverse } from './../../../helpers/number';

/**
 * @class Scroll
 */
class Scroll {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    this.wot = wotInstance;

    // legacy support
    this.instance = wotInstance;
  }

  /**
   * Scrolls viewport to a cell.
   *
   * @param {CellCoords} coords
   * @param {Boolean} [snapToTop]
   * @param {Boolean} [snapToRight]
   * @param {Boolean} [snapToBottom]
   * @param {Boolean} [snapToLeft]
   * @returns {Boolean}
   */
  scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft) {
    const scrolledHorizontally = this.scrollViewportHorizontally(coords.col, snapToRight, snapToLeft);
    const scrolledVertically = this.scrollViewportVertically(coords.row, snapToTop, snapToBottom);

    return scrolledHorizontally || scrolledVertically;
  }

  /**
   * Scrolls viewport to a column.
   *
   * @param {Number} column Visual column index.
   * @param {Boolean} [snapToRight]
   * @param {Boolean} [snapToLeft]
   * @returns {Boolean}
   */
  scrollViewportHorizontally(column, snapToRight, snapToLeft) {
    if (!this.wot.drawn) {
      return false;
    }

    const {
      fixedColumnsLeft,
      leftOverlay,
      totalColumns,
    } = this._getVariables();
    let result = false;

    if (column >= 0 && column <= Math.max(totalColumns - 1, 0)) {
      if (column >= fixedColumnsLeft && (column < this.getFirstVisibleColumn() || snapToLeft)) {
        result = leftOverlay.scrollTo(column);
      } else if (column > this.getLastVisibleColumn() || snapToRight) {
        result = leftOverlay.scrollTo(column, true);
      }
    }

    return result;
  }

  /**
   * Scrolls viewport to a row.
   *
   * @param {Number} row Visual row index.
   * @param {Boolean} [snapToTop]
   * @param {Boolean} [snapToBottom]
   * @returns {Boolean}
   */
  scrollViewportVertically(row, snapToTop, snapToBottom) {
    if (!this.wot.drawn) {
      return false;
    }

    const {
      fixedRowsBottom,
      fixedRowsTop,
      topOverlay,
      totalRows,
    } = this._getVariables();
    let result = false;

    if (row >= 0 && row <= Math.max(totalRows - 1, 0)) {
      if (row >= fixedRowsTop && (row < this.getFirstVisibleRow() || snapToTop)) {
        result = topOverlay.scrollTo(row);
      } else if ((row > this.getLastVisibleRow() && row < totalRows - fixedRowsBottom) || snapToBottom) {
        result = topOverlay.scrollTo(row, true);
      }
    }

    return result;
  }

  /**
   * Get first visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {Number}
   */
  getFirstVisibleRow() {
    const {
      topOverlay,
      wtTable,
      wtViewport,
      totalRows,
      fixedRowsTop,
    } = this._getVariables();

    let firstVisibleRow = wtTable.getFirstVisibleRow();

    if (topOverlay.mainTableScrollableElement === window) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const totalTableHeight = innerHeight(wtTable.hider);
      const windowHeight = innerHeight(window);
      const windowScrollTop = getScrollTop(window);

      // Only calculate firstVisibleRow when table didn't filled (from up) whole viewport space
      if (rootElementOffset.top + totalTableHeight - windowHeight <= windowScrollTop) {
        let rowsHeight = wtViewport.getColumnHeaderHeight();

        rowsHeight += topOverlay.sumCellSizes(0, fixedRowsTop);

        rangeEachReverse(totalRows, 1, (row) => {
          rowsHeight += topOverlay.sumCellSizes(row - 1, row);

          if (rootElementOffset.top + totalTableHeight - rowsHeight <= windowScrollTop) {
            // Return physical row + 1
            firstVisibleRow = row;

            return false;
          }
        });
      }
    }

    return firstVisibleRow;
  }

  /**
   * Get last visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {Number}
   */
  getLastVisibleRow() {
    const {
      topOverlay,
      wtTable,
      wtViewport,
      totalRows,
    } = this._getVariables();

    let lastVisibleRow = wtTable.getLastVisibleRow();

    if (topOverlay.mainTableScrollableElement === window) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const windowHeight = innerHeight(window);
      const windowScrollTop = getScrollTop(window);

      // Only calculate lastVisibleRow when table didn't filled (from bottom) whole viewport space
      if (rootElementOffset.top > windowScrollTop) {
        let rowsHeight = wtViewport.getColumnHeaderHeight();

        rangeEach(1, totalRows, (row) => {
          rowsHeight += topOverlay.sumCellSizes(row - 1, row);

          if (rootElementOffset.top + rowsHeight - windowScrollTop >= windowHeight) {
            // Return physical row - 1 (-2 because rangeEach gives row index + 1 - sumCellSizes requirements)
            lastVisibleRow = row - 2;

            return false;
          }
        });
      }
    }

    return lastVisibleRow;
  }

  /**
   * Get first visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {Number}
   */
  getFirstVisibleColumn() {
    const {
      leftOverlay,
      wtTable,
      wtViewport,
      totalColumns,
    } = this._getVariables();

    let firstVisibleColumn = wtTable.getFirstVisibleColumn();

    if (leftOverlay.mainTableScrollableElement === window) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const totalTableWidth = innerWidth(wtTable.hider);
      const windowWidth = innerWidth(window);
      const windowScrollLeft = getScrollLeft(window);

      // Only calculate firstVisibleColumn when table didn't filled (from left) whole viewport space
      if (rootElementOffset.left + totalTableWidth - windowWidth <= windowScrollLeft) {
        let columnsWidth = wtViewport.getRowHeaderWidth();

        rangeEachReverse(totalColumns, 1, (column) => {
          columnsWidth += leftOverlay.sumCellSizes(column - 1, column);

          if (rootElementOffset.left + totalTableWidth - columnsWidth <= windowScrollLeft) {
            // Return physical column + 1
            firstVisibleColumn = column;

            return false;
          }
        });
      }
    }

    return firstVisibleColumn;
  }

  /**
   * Get last visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {Number}
   */
  getLastVisibleColumn() {
    const {
      leftOverlay,
      wtTable,
      wtViewport,
      totalColumns,
    } = this._getVariables();

    let lastVisibleColumn = wtTable.getLastVisibleColumn();

    if (leftOverlay.mainTableScrollableElement === window) {
      const rootElementOffset = offset(wtTable.wtRootElement);
      const windowWidth = innerWidth(window);
      const windowScrollLeft = getScrollLeft(window);

      // Only calculate lastVisibleColumn when table didn't filled (from right) whole viewport space
      if (rootElementOffset.left > windowScrollLeft) {
        let columnsWidth = wtViewport.getRowHeaderWidth();

        rangeEach(1, totalColumns, (column) => {
          columnsWidth += leftOverlay.sumCellSizes(column - 1, column);

          if (rootElementOffset.left + columnsWidth - windowScrollLeft >= windowWidth) {
            // Return physical column - 1 (-2 because rangeEach gives column index + 1 - sumCellSizes requirements)
            lastVisibleColumn = column - 2;

            return false;
          }
        });
      }
    }

    return lastVisibleColumn;
  }

  /**
   * Returns collection of variables used to rows and columns visibility calculations.
   *
   * @returns {Object}
   * @private
   */
  _getVariables() {
    const wot = this.wot;
    const topOverlay = wot.wtOverlays.topOverlay;
    const leftOverlay = wot.wtOverlays.leftOverlay;
    const wtTable = wot.wtTable;
    const wtViewport = wot.wtViewport;
    const totalRows = wot.getSetting('totalRows');
    const totalColumns = wot.getSetting('totalColumns');
    const fixedRowsTop = wot.getSetting('fixedRowsTop');
    const fixedRowsBottom = wot.getSetting('fixedRowsBottom');
    const fixedColumnsLeft = wot.getSetting('fixedColumnsLeft');

    return {
      topOverlay,
      leftOverlay,
      wtTable,
      wtViewport,
      totalRows,
      totalColumns,
      fixedRowsTop,
      fixedRowsBottom,
      fixedColumnsLeft
    };
  }
}

export default Scroll;
