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
   * Default column width.
   *
   * @type {number}
   */
  static get DEFAULT_WIDTH() {
    return 50;
  }

  /**
   * @param {object} options Object with all options specified for column viewport calculation.
   * @param {number} options.viewportSize Width of the viewport.
   * @param {number} options.scrollOffset Current horizontal scroll position of the viewport.
   * @param {number} options.totalItems Total number of columns.
   * @param {Function} options.itemSizeFn Function that returns the width of the column at a given index (in px).
   * @param {Function} options.overrideFn Function that changes calculated this.startRow, this.endRow (used by MergeCells plugin).
   * @param {string} options.calculationType String which describes types of calculation which will be performed.
   * @param {string} [options.stretchMode] Stretch mode 'all' or 'last'.
   * @param {Function} [options.stretchingItemWidthFn] Function that returns the new width of the stretched column.
   */
  constructor({
    viewportSize,
    scrollOffset,
    totalItems,
    itemSizeFn,
    overrideFn,
    calculationType,
    stretchMode,
    stretchingItemWidthFn = width => width
  } = {}) {
    privatePool.set(this, {
      viewportWidth: viewportSize,
      scrollOffset,
      totalColumns: totalItems,
      columnWidthFn: itemSizeFn,
      overrideFn,
      calculationType,
      stretchingColumnWidthFn: stretchingItemWidthFn,
    });

    /**
     * Number of rendered/visible columns.
     *
     * @type {number}
     */
    this.count = 0;

    /**
     * Index of the first rendered/visible column (can be overwritten using overrideFn).
     *
     * @type {number|null}
     */
    this.startColumn = null;

    /**
     * Index of the last rendered/visible column (can be overwritten using overrideFn).
     *
     * @type {null}
     */
    this.endColumn = null;

    /**
     * Position of the first rendered/visible column (in px).
     *
     * @type {number|null}
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
   * Calculates viewport.
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
    const totalColumns = priv.totalColumns;
    const viewportWidth = priv.viewportWidth;

    for (let i = 0; i < totalColumns; i++) {
      columnWidth = this._getColumnWidth(i);

      if (sum <= scrollOffset && calculationType !== FULLY_VISIBLE_TYPE) {
        this.startColumn = i;
      }

      // +1 pixel for row header width compensation for horizontal scroll > 0
      const compensatedViewportWidth = scrollOffset > 0 ? viewportWidth + 1 : viewportWidth;

      if (sum >= scrollOffset && sum + (calculationType === FULLY_VISIBLE_TYPE ? columnWidth : 0) <= scrollOffset + compensatedViewportWidth) { // eslint-disable-line max-len
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

    if (this.startPosition === void 0) {
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
    if (this.stretch === 'none') {
      return;
    }
    let totalColumnsWidth = totalWidth;

    this.totalTargetWidth = totalColumnsWidth;

    const priv = privatePool.get(this);
    const totalColumns = priv.totalColumns;
    let sumAll = 0;

    for (let i = 0; i < totalColumns; i++) {
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

    if (this.stretch === 'all' && this.stretchAllRatio !== 0) {
      result = this._getStretchedAllColumnWidth(column, baseWidth);

    } else if (this.stretch === 'last' && this.stretchLastWidth !== 0) {
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
    const priv = privatePool.get(this);
    const totalColumns = priv.totalColumns;

    if (!this.stretchAllColumnsWidth[column]) {
      const stretchedWidth = Math.round(baseWidth * this.stretchAllRatio);
      const newStretchedWidth = priv.stretchingColumnWidthFn(stretchedWidth, column);

      if (newStretchedWidth === void 0) {
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
      if (sumRatioWidth !== this.totalTargetWidth) {
        this.stretchAllColumnsWidth[this.stretchAllColumnsWidth.length - 1] += this.totalTargetWidth - sumRatioWidth;
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
    const priv = privatePool.get(this);
    const totalColumns = priv.totalColumns;

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
    let width = privatePool.get(this).columnWidthFn(column);

    if (isNaN(width)) {
      width = ViewportColumnsCalculator.DEFAULT_WIDTH;
    }

    return width;
  }
}

export default ViewportColumnsCalculator;
