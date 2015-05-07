
const privatePool = new WeakMap();

/**
 * Calculates indexes of rows to render OR rows that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * @class WalkontableViewportRowsCalculator
 */
class WalkontableViewportRowsCalculator {
  /**
   * Default row height
   *
   * @type {Number}
   */
  static get DEFAULT_HEIGHT() {
    return 23;
  }

  /**
   * @param {Number} viewportHeight Height of the viewport
   * @param {Number} scrollOffset Current vertical scroll position of the viewport
   * @param {Number} totalRows Total number of rows
   * @param {Function} rowHeightFn Function that returns the height of the row at a given index (in px)
   * @param {Function} overrideFn Function that changes calculated this.startRow, this.endRow (used by MergeCells plugin)
   * @param {Boolean} onlyFullyVisible if `true`, only startRow and endRow will be indexes of rows that are fully in viewport
   */
  constructor(viewportHeight, scrollOffset, totalRows, rowHeightFn, overrideFn, onlyFullyVisible) {
    privatePool.set(this, {
      viewportHeight,
      scrollOffset,
      totalRows,
      rowHeightFn,
      overrideFn,
      onlyFullyVisible
    });

    /**
     * Number of rendered/visible rows
     *
     * @type {Number}
     */
    this.count = 0;

    /**
     * Index of the first rendered/visible row (can be overwritten using overrideFn)
     *
     * @type {Number|null}
     */
    this.startRow = null;

    /**
     * Index of the last rendered/visible row (can be overwritten using overrideFn)
     *
     * @type {null}
     */
    this.endRow = null;

    /**
     * Position of the first rendered/visible row (in px)
     *
     * @type {Number|null}
     */
    this.startPosition = null;

    this.calculate();
  }

  /**
   * Calculates viewport
   */
  calculate() {
    let sum = 0;
    let needReverse = true;
    let startPositions = [];

    let priv = privatePool.get(this);
    let onlyFullyVisible = priv.onlyFullyVisible;
    let overrideFn = priv.overrideFn;
    let rowHeightFn = priv.rowHeightFn;
    let scrollOffset = priv.scrollOffset;
    let totalRows = priv.totalRows;
    let viewportHeight = priv.viewportHeight;

    // Calculate the number (start and end index) of rows needed
    for (let i = 0; i < totalRows; i++) {
      let rowHeight = rowHeightFn(i);

      if (rowHeight === undefined) {
        rowHeight = WalkontableViewportRowsCalculator.DEFAULT_HEIGHT;
      }
      if (sum <= scrollOffset && !onlyFullyVisible) {
        this.startRow = i;
      }

      // the row is within the "visible range"
      if (sum >= scrollOffset && sum + rowHeight <= scrollOffset + viewportHeight) {
        if (this.startRow === null) {
          this.startRow = i;
        }
        this.endRow = i;
      }
      startPositions.push(sum);
      sum += rowHeight;

      if (!onlyFullyVisible) {
        this.endRow = i;
      }
      if (sum >= scrollOffset + viewportHeight) {
        needReverse = false;
        break;
      }
    }

    //If the estimation has reached the last row and there is still some space available in the viewport,
    //we need to render in reverse in order to fill the whole viewport with rows
    if (this.endRow === totalRows - 1 && needReverse) {
      this.startRow = this.endRow;

      while (this.startRow > 0) {
        // rowHeight is the height of the last row
        let viewportSum = startPositions[this.endRow] + rowHeight - startPositions[this.startRow - 1];

        if (viewportSum <= viewportHeight || !onlyFullyVisible) {
          this.startRow--;
        }
        if (viewportSum >= viewportHeight) {
          break;
        }
      }
    }

    if (this.startRow !== null && overrideFn) {
      overrideFn(this);
    }
    this.startPosition = startPositions[this.startRow];

    if (this.startPosition == void 0) {
      this.startPosition = null;
    }
    if (this.startRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}

export {WalkontableViewportRowsCalculator};

window.WalkontableViewportRowsCalculator = WalkontableViewportRowsCalculator;
