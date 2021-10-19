import { RENDER_TYPE, FULLY_VISIBLE_TYPE } from './constants';

const privatePool = new WeakMap();

/**
 * Calculates indexes of rows to render OR rows that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * @class ViewportRowsCalculator
 */
class ViewportRowsCalculator {
  /**
   * Default row height.
   *
   * @type {number}
   */
  static get DEFAULT_HEIGHT() {
    return 23;
  }

  /**
   * @param {object} options Object with all options specified for row viewport calculation.
   * @param {number} options.viewportSize Height of the viewport.
   * @param {number} options.scrollOffset Current vertical scroll position of the viewport.
   * @param {number} options.totalItems Total number of rows.
   * @param {Function} options.itemSizeFn Function that returns the height of the row at a given index (in px).
   * @param {Function} options.overrideFn Function that changes calculated this.startRow, this.endRow (used by MergeCells plugin).
   * @param {string} options.calculationType String which describes types of calculation which will be performed.
   * @param {number} options.scrollbarHeight The scrollbar height.
   */
  constructor({
    viewportSize,
    scrollOffset,
    totalItems,
    itemSizeFn,
    overrideFn,
    calculationType,
    scrollbarHeight
  } = {}) {
    privatePool.set(this, {
      viewportHeight: viewportSize,
      scrollOffset,
      totalRows: totalItems,
      rowHeightFn: itemSizeFn,
      overrideFn,
      calculationType,
      horizontalScrollbarHeight: scrollbarHeight
    });

    /**
     * Number of rendered/visible rows.
     *
     * @type {number}
     */
    this.count = 0;

    /**
     * Index of the first rendered/visible row (can be overwritten using overrideFn).
     *
     * @type {number|null}
     */
    this.startRow = null;

    /**
     * Index of the last rendered/visible row (can be overwritten using overrideFn).
     *
     * @type {null}
     */
    this.endRow = null;

    /**
     * Position of the first rendered/visible row (in px).
     *
     * @type {number|null}
     */
    this.startPosition = null;

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate() {
    let sum = 0;
    let needReverse = true;
    const startPositions = [];

    const priv = privatePool.get(this);
    const calculationType = priv.calculationType;
    const overrideFn = priv.overrideFn;
    const rowHeightFn = priv.rowHeightFn;
    const scrollOffset = priv.scrollOffset;
    const totalRows = priv.totalRows;
    const viewportHeight = priv.viewportHeight;
    const horizontalScrollbarHeight = priv.horizontalScrollbarHeight || 0;
    let rowHeight;

    // Calculate the number (start and end index) of rows needed
    for (let i = 0; i < totalRows; i++) {
      rowHeight = rowHeightFn(i);

      if (isNaN(rowHeight)) {
        rowHeight = ViewportRowsCalculator.DEFAULT_HEIGHT;
      }
      if (sum <= scrollOffset && calculationType !== FULLY_VISIBLE_TYPE) {
        this.startRow = i;
      }

      if (sum >= scrollOffset && sum + (calculationType === FULLY_VISIBLE_TYPE ? rowHeight : 0) <= scrollOffset + viewportHeight - horizontalScrollbarHeight) { // eslint-disable-line max-len
        if (this.startRow === null) {
          this.startRow = i;
        }
        this.endRow = i;
      }

      startPositions.push(sum);
      sum += rowHeight;

      if (calculationType !== FULLY_VISIBLE_TYPE) {
        this.endRow = i;
      }
      if (sum >= scrollOffset + viewportHeight - horizontalScrollbarHeight) {
        needReverse = false;
        break;
      }
    }

    // If the estimation has reached the last row and there is still some space available in the viewport,
    // we need to render in reverse in order to fill the whole viewport with rows
    if (this.endRow === totalRows - 1 && needReverse) {
      this.startRow = this.endRow;

      while (this.startRow > 0) {
        // rowHeight is the height of the last row
        const viewportSum = startPositions[this.endRow] + rowHeight - startPositions[this.startRow - 1];

        if (viewportSum <= viewportHeight - horizontalScrollbarHeight || calculationType !== FULLY_VISIBLE_TYPE) {
          this.startRow -= 1;
        }
        if (viewportSum >= viewportHeight - horizontalScrollbarHeight) {
          break;
        }
      }
    }

    if (calculationType === RENDER_TYPE && this.startRow !== null && overrideFn) {
      overrideFn(this);
    }
    this.startPosition = startPositions[this.startRow];

    if (this.startPosition === void 0) {
      this.startPosition = null;
    }

    // If totalRows exceeded its total rows size set endRow to the latest item
    if (totalRows < this.endRow) {
      this.endRow = totalRows - 1;
    }

    if (this.startRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}

export default ViewportRowsCalculator;
