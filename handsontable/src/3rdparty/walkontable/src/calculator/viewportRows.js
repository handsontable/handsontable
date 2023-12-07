import { RENDER_TYPE, FULLY_VISIBLE_TYPE } from './constants';

/**
 * @typedef {object} ViewportRowsCalculatorOptions
 * @property {number} viewportHeight Height of the viewport.
 * @property {number} scrollOffset Current vertical scroll position of the viewport.
 * @property {number} totalRows Total number of rows.
 * @property {Function} rowHeightFn Function that returns the height of the row at a given index (in px).
 * @property {Function} overrideFn Function that changes calculated this.startRow, this.endRow (used by MergeCells plugin).
 * @property {string} calculationType String which describes types of calculation which will be performed.
 * @property {number} horizontalScrollbarHeight The scrollbar height.
 */
/**
 * Calculates indexes of rows to render OR rows that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * @class ViewportRowsCalculator
 */
export class ViewportRowsCalculator {
  /**
   * Default row height.
   *
   * @type {number}
   */
  static get DEFAULT_HEIGHT() {
    return 23;
  }

  /**
   * Number of rendered/visible rows.
   *
   * @type {number}
   */
  count = 0;
  /**
   * Index of the first rendered/visible row (can be overwritten using overrideFn).
   *
   * @type {number|null}
   */
  startRow = null;
  /**
   * Index of the last rendered/visible row (can be overwritten using overrideFn).
   *
   * @type {null}
   */
  endRow = null;
  /**
   * Position of the first rendered/visible row (in px).
   *
   * @type {number|null}
   */
  startPosition = null;
  /**
   * Determines if the viewport is visible in the trimming container.
   *
   * @type {boolean}
   */
  isVisibleInTrimmingContainer = false;
  /**
   * The calculator options.
   *
   * @type {ViewportRowsCalculatorOptions}
   */
  #options;

  /**
   * @param {ViewportRowsCalculatorOptions} options Object with all options specified for row viewport calculation.
   */
  constructor(options) {
    this.#options = options;
    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate() {
    const {
      calculationType,
      overrideFn,
      rowHeightFn,
      scrollOffset,
      totalRows,
      viewportHeight,
    } = this.#options;
    const zeroBasedScrollOffset = Math.max(this.#options.scrollOffset, 0);
    const horizontalScrollbarHeight = this.#options.horizontalScrollbarHeight || 0;
    let sum = 0;
    let needReverse = true;
    const startPositions = [];
    let rowHeight;
    let firstVisibleRowHeight = 0;
    let lastVisibleRowHeight = 0;

    // Calculate the number (start and end index) of rows needed
    for (let i = 0; i < totalRows; i++) {
      rowHeight = rowHeightFn(i);

      if (isNaN(rowHeight)) {
        rowHeight = ViewportRowsCalculator.DEFAULT_HEIGHT;
      }
      if (sum <= zeroBasedScrollOffset && calculationType !== FULLY_VISIBLE_TYPE) {
        this.startRow = i;

        firstVisibleRowHeight = rowHeight;
      }

      if (sum >= zeroBasedScrollOffset && sum + (calculationType === FULLY_VISIBLE_TYPE ? rowHeight : 0) <= zeroBasedScrollOffset + viewportHeight - horizontalScrollbarHeight) { // eslint-disable-line max-len
        if (this.startRow === null) {
          this.startRow = i;

          firstVisibleRowHeight = rowHeight;
        }
        this.endRow = i;
      }

      startPositions.push(sum);
      sum += rowHeight;
      lastVisibleRowHeight = rowHeight;

      if (calculationType !== FULLY_VISIBLE_TYPE) {
        this.endRow = i;
      }
      if (sum >= zeroBasedScrollOffset + viewportHeight - horizontalScrollbarHeight) {
        needReverse = false;
        break;
      }
    }

    const mostBottomScrollOffset = scrollOffset + viewportHeight - horizontalScrollbarHeight;
    const topRowOffset = calculationType === FULLY_VISIBLE_TYPE ? firstVisibleRowHeight : 0;
    const bottomRowOffset = calculationType === FULLY_VISIBLE_TYPE ? 0 : lastVisibleRowHeight;

    if (mostBottomScrollOffset < topRowOffset || scrollOffset > startPositions.at(-1) + bottomRowOffset) {
      this.isVisibleInTrimmingContainer = false;

    } else {
      this.isVisibleInTrimmingContainer = true;
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

    if (this.startPosition === undefined) {
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
