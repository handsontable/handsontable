import {
  innerHeight,
  innerWidth,
  getScrollLeft,
  getScrollTop,
  offset,
} from './../../../helpers/dom/element';
import {rangeEach, rangeEachReverse} from './../../../helpers/number';

/**
 * @class WalkontableScroll
 */
class WalkontableScroll {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    this.wot = wotInstance;

    // legacy support
    this.instance = wotInstance;
  }

  /**
   * Scrolls viewport to a cell by minimum number of cells
   *
   * @param {WalkontableCellCoords} coords
   */
  scrollViewport(coords) {
    if (!this.wot.drawn) {
      return;
    }

    const {
      topOverlay,
      leftOverlay,
      totalRows,
      totalColumns,
      fixedRowsTop,
      fixedRowsBottom,
      fixedColumnsLeft,
      } = this._getVariables();

    if (coords.row < 0 || coords.row > Math.max(totalRows - 1, 0)) {
      throw new Error(`row ${coords.row} does not exist`);
    }

    if (coords.col < 0 || coords.col > Math.max(totalColumns - 1, 0)) {
      throw new Error(`column ${coords.col} does not exist`);
    }

    if (coords.row >= fixedRowsTop && coords.row < this.getFirstVisibleRow()) {
      topOverlay.scrollTo(coords.row);

    } else if (coords.row > this.getLastVisibleRow() && coords.row < totalRows - fixedRowsBottom) {
      topOverlay.scrollTo(coords.row, true);
    }

    if (coords.col >= fixedColumnsLeft && coords.col < this.getFirstVisibleColumn()) {
      leftOverlay.scrollTo(coords.col);

    } else if (coords.col > this.getLastVisibleColumn()) {
      leftOverlay.scrollTo(coords.col, true);
    }
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
      fixedColumnsLeft,
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

export {WalkontableScroll};

window.WalkontableScroll = WalkontableScroll;
