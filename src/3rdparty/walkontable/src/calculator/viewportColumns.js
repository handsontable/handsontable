import { RENDER_TYPE, FULLY_VISIBLE_TYPE } from './constants';

const privatePool = new WeakMap();

/**
 * Calculates indexes of columns to render OR columns that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * @class ViewportColumnsCalculator
 */
class ViewportColumnsCalculator {
  /**
   * Default column width
   *
   * @type {Number}
   */
  static get DEFAULT_WIDTH() {
    return 50;
  }

  /**
   * @param {Object} options Object with all options specyfied for column viewport calculation.
   * @param {Number} options.viewportWidth Width of the viewport
   * @param {Number} options.scrollOffset Current horizontal scroll position of the viewport
   * @param {Number} options.hardstopStart Index of the first possibly renderable column
   * @param {Number} options.hardstopEnd Index of the last possibly renderable column
   * @param {Function} options.columnWidthFn Function that returns the width of the column at a given index (in px)
   * @param {Function} options.overrideFn Function that changes calculated this.startRow, this.endRow (used by MergeCells plugin)
   * @param {String} options.calculationType String which describes types of calculation which will be performed.
   * @param {String} [options.stretchH] Stretch mode 'all' or 'last'
   * @param {Function} [options.stretchingColumnWidthFn] Function that returns the new width of the stretched column.
   */
  constructor({
    viewportSize,
    scrollOffset,
    hardstopStart,
    hardstopEnd,
    itemSizeFn,
    overrideFn,
    calculationType,
    stretchMode,
    stretchingItemWidthFn = width => width
  } = {}) {
    privatePool.set(this, {
      viewportWidth: viewportSize,
      scrollOffset,
      hardstopStart,
      hardstopEnd,
      columnWidthFn: itemSizeFn,
      overrideFn,
      calculationType,
      stretchingColumnWidthFn: stretchingItemWidthFn,
    });

    /**
     * Number of rendered/visible columns
     *
     * @type {Number}
     */
    this.count = 0;

    /**
     * Index of the first rendered/visible column (can be overwritten using overrideFn)
     *
     * @type {Number|null}
     */
    this.startColumn = null;

    /**
     * Index of the last rendered/visible column (can be overwritten using overrideFn)
     *
     * @type {null}
     */
    this.endColumn = null;

    /**
     * Position of the first rendered/visible column (in px)
     *
     * @type {Number|null}
     */
    this.startPosition = null;

    this.stretchAllRatio = 0;
    this.stretchLastWidth = 0;
    this.stretch = stretchMode;
    this.totalTargetWidth = 0;
    this.needVerifyLastColumnWidth = true;
    this.stretchAllColumnsWidth = [];

    this.calculate();
  }

  /**
   * Calculates viewport
   */
  calculate() {
    let sum = 0;
    let needReverse = true;
    const startPositions = [];
    let columnWidth;

    const priv = privatePool.get(this);
    const calculationType = priv.calculationType;
    const overrideFn = priv.overrideFn;
    const scrollOffset = priv.scrollOffset;
    const { hardstopStart, hardstopEnd } = priv;
    const viewportWidth = priv.viewportWidth;

    for (let i = hardstopStart; i <= hardstopEnd; i++) {
      columnWidth = this._getColumnWidth(i);

      if (sum <= scrollOffset && calculationType !== FULLY_VISIBLE_TYPE) {
        this.startColumn = i;
      }

      // +1 pixel for row header width compensation for horizontal scroll > 0
      const compensatedViewportWidth = scrollOffset > 0 ? viewportWidth + 1 : viewportWidth;

      if (sum >= scrollOffset && sum + (calculationType === FULLY_VISIBLE_TYPE ? columnWidth : 0) <= scrollOffset + compensatedViewportWidth) {
        if (this.startColumn === null || this.startColumn === void 0) {
          this.startColumn = i;
        }
        this.endColumn = i;
      }
      startPositions.push(sum);
      sum += columnWidth;

      if (calculationType !== FULLY_VISIBLE_TYPE) {
        this.endColumn = i;
      }
      if (sum >= scrollOffset + viewportWidth) {
        needReverse = false;
        break;
      }
    }

    if (this.endColumn === hardstopEnd && needReverse) {
      this.startColumn = this.endColumn;

      while (this.startColumn > hardstopStart) {
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

    if (this.startPosition === void 0) {
      this.startPosition = null;
    }

    if (hardstopEnd + 1 < this.endColumn) {
      this.endColumn = hardstopEnd;
    }

    if (this.startColumn !== null) {
      this.count = this.endColumn - this.startColumn + 1;
    }
  }

  /**
   * Recalculate columns stretching.
   *
   * @param {Number} totalWidth
   */
  refreshStretching(totalWidth) {
    if (this.stretch === 'none') {
      return;
    }
    let totalColumnsWidth = totalWidth;
    this.totalTargetWidth = totalColumnsWidth;

    const priv = privatePool.get(this);
    const hardstopEnd = priv.hardstopEnd;
    let sumAll = 0;

    for (let i = 0; i <= hardstopEnd; i++) {
      const columnWidth = this._getColumnWidth(i);
      const permanentColumnWidth = priv.stretchingColumnWidthFn(void 0, i);

      if (typeof permanentColumnWidth === 'number') {
        totalColumnsWidth -= permanentColumnWidth;
      } else {
        sumAll += columnWidth;
      }
    }
    const remainingSize = totalColumnsWidth - sumAll;

    if (this.stretch === 'all' && remainingSize > 0) {
      this.stretchAllRatio = totalColumnsWidth / sumAll;
      this.stretchAllColumnsWidth = [];
      this.needVerifyLastColumnWidth = true;

    } else if (this.stretch === 'last' && totalColumnsWidth !== Infinity) {
      const columnWidth = this._getColumnWidth(hardstopEnd);
      const lastColumnWidth = remainingSize + columnWidth;

      this.stretchLastWidth = lastColumnWidth >= 0 ? lastColumnWidth : columnWidth;
    }
  }

  /**
   * Get stretched column width based on stretchH (all or last) setting passed in handsontable instance.
   *
   * @param {Number} column
   * @param {Number} baseWidth
   * @returns {Number|null}
   */
  getStretchedColumnWidth(column, baseWidth) {
    let result = null;

    if (this.stretch === 'all' && this.stretchAllRatio !== 0) {
      result = this._getStretchedAllColumnWidth(column, baseWidth);

    } else if (this.stretch === 'last' && this.stretchLastWidth !== 0) {
      result = this._getStretchedLastColumnWidth(column);
    }

    return result;
  }

  /**
   * @param {Number} column
   * @param {Number} baseWidth
   * @returns {Number}
   * @private
   */
  _getStretchedAllColumnWidth(column, baseWidth) {
    let sumRatioWidth = 0;
    const priv = privatePool.get(this);
    const hardstopEnd = priv.hardstopEnd;

    if (!this.stretchAllColumnsWidth[column]) {
      const stretchedWidth = Math.round(baseWidth * this.stretchAllRatio);
      const newStretchedWidth = priv.stretchingColumnWidthFn(stretchedWidth, column);

      if (newStretchedWidth === void 0) {
        this.stretchAllColumnsWidth[column] = stretchedWidth;
      } else {
        this.stretchAllColumnsWidth[column] = isNaN(newStretchedWidth) ? this._getColumnWidth(column) : newStretchedWidth;
      }
    }

    if (this.stretchAllColumnsWidth.length === (hardstopEnd + 1) && this.needVerifyLastColumnWidth) {
      this.needVerifyLastColumnWidth = false;

      for (let i = 0; i < this.stretchAllColumnsWidth.length; i++) {
        sumRatioWidth += this.stretchAllColumnsWidth[i];
      }
      if (sumRatioWidth !== this.totalTargetWidth) {
        this.stretchAllColumnsWidth[this.stretchAllColumnsWidth.length - 1] += this.totalTargetWidth - sumRatioWidth;
      }
    }

    return this.stretchAllColumnsWidth[column];
  }

  /**
   * @param {Number} column
   * @returns {Number|null}
   * @private
   */
  _getStretchedLastColumnWidth(column) {
    const priv = privatePool.get(this);
    const hardstopEnd = priv.hardstopEnd;

    if (column === hardstopEnd) {
      return this.stretchLastWidth;
    }

    return null;
  }

  /**
   * @param {Number} column Column index.
   * @returns {Number}
   * @private
   */
  _getColumnWidth(column) {
    let width = privatePool.get(this).columnWidthFn(column);

    if (isNaN(width)) {
      width = ViewportColumnsCalculator.DEFAULT_WIDTH;
    }

    return width;
  }
}

export default ViewportColumnsCalculator;
