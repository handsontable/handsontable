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
   * Default row height
   *
   * @type {Number}
   */
  static get DEFAULT_HEIGHT() {
    return 23;
  }

  /**
   * @param {Object} options Object with all options specyfied for row viewport calculation.
   * @param {Number} options.viewportHeight Height of the viewport
   * @param {Number} options.scrollOffset Current vertical scroll position of the viewport
   * @param {Number} options.hardstopStart Index of the first possibly renderable row
   * @param {Number} options.hardstopEnd Index of the last possibly renderable row
   * @param {Function} options.rowHeightFn Function that returns the height of the row at a given index (in px)
   * @param {Function} options.overrideFn Function that changes calculated this.startRow, this.endRow (used by MergeCells plugin)
   * @param {String} options.calculationType String which describes types of calculation which will be performed.
   * @param {Number} options.horizontalScrollbarHeight
   */
  constructor({
    viewportSize,
    scrollOffset,
    hardstopStart,
    hardstopEnd,
    itemSizeFn,
    overrideFn,
    calculationType,
    scrollbarHeight
  } = {}) {
    privatePool.set(this, {
      viewportHeight: viewportSize,
      scrollOffset,
      hardstopStart,
      hardstopEnd,
      rowHeightFn: itemSizeFn,
      overrideFn,
      calculationType,
      horizontalScrollbarHeight: scrollbarHeight
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
    const startPositions = [];

    const priv = privatePool.get(this);
    const calculationType = priv.calculationType;
    const overrideFn = priv.overrideFn;
    const rowHeightFn = priv.rowHeightFn;
    const scrollOffset = priv.scrollOffset;
    const { hardstopStart, hardstopEnd } = priv;
    const viewportHeight = priv.viewportHeight;
    const horizontalScrollbarHeight = priv.horizontalScrollbarHeight || 0;
    let rowHeight;

    // Calculate the number (start and end index) of rows needed
    for (let i = hardstopStart; i <= hardstopEnd; i++) {
      rowHeight = rowHeightFn(i);

      if (isNaN(rowHeight)) {
        rowHeight = ViewportRowsCalculator.DEFAULT_HEIGHT;
      }
      if (sum <= scrollOffset && calculationType !== FULLY_VISIBLE_TYPE) {
        this.startRow = i;
      }

      if (sum >= scrollOffset && sum + (calculationType === FULLY_VISIBLE_TYPE ? rowHeight : 0) <= scrollOffset + viewportHeight - horizontalScrollbarHeight) {
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
    if (this.endRow === hardstopEnd && needReverse) {
      this.startRow = this.endRow;

      while (this.startRow > hardstopStart) {
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

    if (hardstopEnd + 1 < this.endRow) {
      this.endRow = hardstopEnd;
    }

    if (this.startRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}

export default ViewportRowsCalculator;
