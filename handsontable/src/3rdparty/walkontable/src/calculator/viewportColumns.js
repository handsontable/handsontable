import { RENDER_TYPE, FULLY_VISIBLE_TYPE } from './constants';

/**
 * @typedef {object} ViewportColumnsCalculatorOptions
 * @property {number} viewportWidth Width of the viewport.
 * @property {number} scrollOffset Current horizontal scroll position of the viewport.
 * @property {number} totalColumns Total number of columns.
 * @property {Function} columnWidthFn Function that returns the width of the column at a given index (in px).
 * @property {Function} overrideFn Function that changes calculated this.startRow, this.endRow (used by
 *   MergeCells plugin).
 * @property {string} calculationType String which describes types of calculation which will be performed.
 * @property {string} inlineStartOffset Inline-start offset of the parent container.
 * @property {string} stretchMode Stretch mode 'all' or 'last'.
 * @property {Function} stretchingColumnWidthFn Function that returns the new width of the stretched column.
 */
/**
 * Calculates indexes of columns to render OR columns that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * @class ViewportColumnsCalculator
 */
class ViewportColumnsCalculator {
  /**
   * Default column width.
   *
   * @type {number}
   */
  static get DEFAULT_WIDTH() {
    return 50;
  }

  /**
   * Number of rendered/visible columns.
   *
   * @type {number}
   */
  count = 0;
  /**
   * Index of the first rendered/visible column (can be overwritten using overrideFn).
   *
   * @type {number|null}
   */
  startColumn = null;
  /**
   * Index of the last rendered/visible column (can be overwritten using overrideFn).
   *
   * @type {null}
   */
  endColumn = null;
  /**
   * Position of the first rendered/visible column (in px).
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
   * @type {number}
   */
  stretchAllRatio = 0;
  /**
   * @type {number}
   */
  stretchLastWidth = 0;
  /**
   * @type {number}
   */
  #totalTargetWidth = 0;
  /**
   * @type {boolean}
   */
  needVerifyLastColumnWidth = true;
  /**
   * @type {number[]}
   */
  stretchAllColumnsWidth = [];
  /**
   * The calculator options.
   *
   * @type {ViewportColumnsCalculatorOptions}
   */
  #options;

  /**
   * @param {ViewportColumnsCalculatorOptions} options Object with all options specified for column viewport calculation.
   */
  constructor(options) {
    this.#options = options;

    if (typeof this.#options.stretchingColumnWidthFn !== 'function') {
      this.#options.stretchingColumnWidthFn = width => width;
    }

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate() {
    const {
      calculationType,
      overrideFn,
      scrollOffset,
      totalColumns,
      viewportWidth,
    } = this.#options;

    const zeroBasedScrollOffset = Math.max(this.#options.scrollOffset, 0);
    // +1 pixel for row header width compensation for horizontal scroll > 0
    const compensatedViewportWidth = zeroBasedScrollOffset > 0 ? viewportWidth + 1 : viewportWidth;
    let sum = 0;
    let needReverse = true;
    const startPositions = [];
    let columnWidth;
    let firstVisibleColumnWidth = 0;
    let lastVisibleColumnWidth = 0;

    for (let i = 0; i < totalColumns; i++) {
      columnWidth = this._getColumnWidth(i);

      if (sum <= zeroBasedScrollOffset && calculationType !== FULLY_VISIBLE_TYPE) {
        this.startColumn = i;

        firstVisibleColumnWidth = columnWidth;
      }

      if (
        sum >= zeroBasedScrollOffset &&
        sum + (calculationType === FULLY_VISIBLE_TYPE ? columnWidth : 0) <=
        zeroBasedScrollOffset + compensatedViewportWidth
      ) {
        if (this.startColumn === null || this.startColumn === undefined) {
          this.startColumn = i;

          firstVisibleColumnWidth = columnWidth;
        }

        this.endColumn = i;
      }

      startPositions.push(sum);

      sum += columnWidth;

      lastVisibleColumnWidth = columnWidth;

      if (calculationType !== FULLY_VISIBLE_TYPE) {
        this.endColumn = i;
      }

      if (sum >= zeroBasedScrollOffset + viewportWidth) {
        needReverse = false;
        break;
      }
    }

    const mostRightScrollOffset = scrollOffset + viewportWidth - compensatedViewportWidth;
    const inlineEndColumnOffset = calculationType === FULLY_VISIBLE_TYPE ? 0 : lastVisibleColumnWidth;
    const inlineStartColumnOffset = calculationType === FULLY_VISIBLE_TYPE ? firstVisibleColumnWidth : 0;

    if (
      // the table is to the left of the viewport
      (
        mostRightScrollOffset < (-1) * this.#options.inlineStartOffset ||
        scrollOffset > startPositions.at(-1) + inlineEndColumnOffset
      ) ||
      // the table is to the right of the viewport
      (((-1) * this.#options.scrollOffset) - this.#options.viewportWidth > (-1) * inlineStartColumnOffset)
    ) {
      this.isVisibleInTrimmingContainer = false;

    } else {
      this.isVisibleInTrimmingContainer = true;
    }

    if (this.endColumn === totalColumns - 1 && needReverse) {
      this.startColumn = this.endColumn;

      while (this.startColumn > 0) {
        const viewportSum = startPositions[this.endColumn] + columnWidth - startPositions[this.startColumn - 1];

        if (viewportSum <= viewportWidth || calculationType !== FULLY_VISIBLE_TYPE) {
          this.startColumn -= 1;
        }
        if (viewportSum > viewportWidth) {
          break;
        }
      }
    }

    if (calculationType === RENDER_TYPE && this.startColumn !== null && overrideFn) {
      overrideFn(this);
    }
    this.startPosition = startPositions[this.startColumn];

    if (this.startPosition === undefined) {
      this.startPosition = null;
    }

    // If totalColumns exceeded its total columns size set endColumn to the latest item
    if (totalColumns < this.endColumn) {
      this.endColumn = totalColumns - 1;
    }

    if (this.startColumn !== null) {
      this.count = this.endColumn - this.startColumn + 1;
    }
  }

  /**
   * Recalculate columns stretching.
   *
   * @param {number} totalWidth The total width of the table.
   */
  refreshStretching(totalWidth) {
    if (this.#options.stretchMode === 'none') {
      return;
    }
    let totalColumnsWidth = totalWidth;

    this.#totalTargetWidth = totalColumnsWidth;

    const totalColumns = this.#options.totalColumns;
    let sumAll = 0;

    for (let i = 0; i < totalColumns; i++) {
      const columnWidth = this._getColumnWidth(i);
      const permanentColumnWidth = this.#options.stretchingColumnWidthFn(undefined, i);

      if (typeof permanentColumnWidth === 'number') {
        totalColumnsWidth -= permanentColumnWidth;
      } else {
        sumAll += columnWidth;
      }
    }
    const remainingSize = totalColumnsWidth - sumAll;

    if (this.#options.stretchMode === 'all' && remainingSize > 0) {
      this.stretchAllRatio = totalColumnsWidth / sumAll;
      this.stretchAllColumnsWidth = [];
      this.needVerifyLastColumnWidth = true;

    } else if (this.#options.stretchMode === 'last' && totalColumnsWidth !== Infinity) {
      const columnWidth = this._getColumnWidth(totalColumns - 1);
      const lastColumnWidth = remainingSize + columnWidth;

      this.stretchLastWidth = lastColumnWidth >= 0 ? lastColumnWidth : columnWidth;
    }
  }

  /**
   * Get stretched column width based on stretchH (all or last) setting passed in handsontable instance.
   *
   * @param {number} column The visual column index.
   * @param {number} baseWidth The default column width.
   * @returns {number|null}
   */
  getStretchedColumnWidth(column, baseWidth) {
    let result = null;

    if (this.#options.stretchMode === 'all' && this.stretchAllRatio !== 0) {
      result = this._getStretchedAllColumnWidth(column, baseWidth);

    } else if (this.#options.stretchMode === 'last' && this.stretchLastWidth !== 0) {
      result = this._getStretchedLastColumnWidth(column);
    }

    return result;
  }

  /**
   * @param {number} column The visual column index.
   * @param {number} baseWidth The default column width.
   * @returns {number}
   * @private
   */
  _getStretchedAllColumnWidth(column, baseWidth) {
    let sumRatioWidth = 0;
    const totalColumns = this.#options.totalColumns;

    if (!this.stretchAllColumnsWidth[column]) {
      const stretchedWidth = Math.round(baseWidth * this.stretchAllRatio);
      const newStretchedWidth = this.#options.stretchingColumnWidthFn(stretchedWidth, column);

      if (newStretchedWidth === undefined) {
        this.stretchAllColumnsWidth[column] = stretchedWidth;
      } else {
        this.stretchAllColumnsWidth[column] = isNaN(newStretchedWidth)
          ? this._getColumnWidth(column) : newStretchedWidth;
      }
    }

    if (this.stretchAllColumnsWidth.length === totalColumns && this.needVerifyLastColumnWidth) {
      this.needVerifyLastColumnWidth = false;

      for (let i = 0; i < this.stretchAllColumnsWidth.length; i++) {
        sumRatioWidth += this.stretchAllColumnsWidth[i];
      }
      if (sumRatioWidth !== this.#totalTargetWidth) {
        this.stretchAllColumnsWidth[this.stretchAllColumnsWidth.length - 1] += this.#totalTargetWidth - sumRatioWidth;
      }
    }

    return this.stretchAllColumnsWidth[column];
  }

  /**
   * @param {number} column The visual column index.
   * @returns {number|null}
   * @private
   */
  _getStretchedLastColumnWidth(column) {
    const totalColumns = this.#options.totalColumns;

    if (column === totalColumns - 1) {
      return this.stretchLastWidth;
    }

    return null;
  }

  /**
   * @param {number} column The visual column index.
   * @returns {number}
   * @private
   */
  _getColumnWidth(column) {
    let width = this.#options.columnWidthFn(column);

    if (isNaN(width)) {
      width = ViewportColumnsCalculator.DEFAULT_WIDTH;
    }

    return width;
  }
}

export default ViewportColumnsCalculator;
