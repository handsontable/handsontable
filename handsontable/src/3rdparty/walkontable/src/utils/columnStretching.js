import { DEFAULT_COLUMN_WIDTH } from '../calculator';

/**
 * @typedef {object} ColumnStretchingOptions
 * @property {number} totalColumns Total number of columns.
 * @property {Function} columnWidthFn Function that returns the width of the column at a given index (in px).
 * @property {'all' | 'last' | 'none'} stretchMode Stretch mode 'all', 'last' or 'none'.
 * @property {Function} stretchingColumnWidthFn Function that returns the new width of the stretched column.
 */
/**
 * @class ColumnStretching
 */
export class ColumnStretching {
  /**
   * @type {number}
   */
  stretchAllRatio = 0;
  /**
   * @type {number}
   */
  stretchLastWidth = 0;
  /**
   * @type {number[]}
   */
  stretchAllColumnsWidth = [];
  /**
   * @type {number}
   */
  #totalTargetWidth = 0;
  /**
   * @type {boolean}
   */
  needVerifyLastColumnWidth = true;
  /**
   * The total number of columns.
   *
   * @type {function(): number}
   */
  #totalColumns = () => 0;
  /**
   * Function that returns the width of the stretched column at a given index (in px).
   *
   * @type {function(): number}
   */
  #stretchingColumnWidthFn = width => width;
  /**
   * Function that returns the width of the column at a given index (in px).
   *
   * @type {function(): number}
   */
  #columnWidthFn = width => width;
  /**
   * Stretch mode.
   *
   * @type {function(): 'all' | 'last' | 'none'}
   */
  #stretchMode = () => 'none';

  /**
   * @param {ColumnStretchingOptions} options Object with all options specified for column viewport calculation.
   */
  constructor({ totalColumns, stretchMode, stretchingColumnWidthFn, columnWidthFn }) {
    this.#totalColumns = totalColumns;
    this.#stretchMode = stretchMode;
    this.#stretchingColumnWidthFn = stretchingColumnWidthFn ?? this.#stretchingColumnWidthFn;
    this.#columnWidthFn = columnWidthFn ?? this.#columnWidthFn;
  }

  /**
   * Recalculate columns stretching.
   *
   * @param {number} totalWidth The total width of the table.
   */
  refreshStretching(totalWidth) {
    if (this.#stretchMode() === 'none') {
      return;
    }

    this.stretchAllRatio = 0;
    this.stretchAllColumnsWidth = [];
    this.needVerifyLastColumnWidth = true;
    this.stretchLastWidth = 0;
    this.#totalTargetWidth = totalWidth;

    let sumAll = 0;

    for (let i = 0; i < this.#totalColumns(); i++) {
      const columnWidth = this._getColumnWidth(i);
      const permanentColumnWidth = this.#stretchingColumnWidthFn(undefined, i);

      if (typeof permanentColumnWidth === 'number') {
        totalWidth -= permanentColumnWidth;
      } else {
        sumAll += columnWidth;
      }
    }
    const remainingSize = totalWidth - sumAll;

    if (this.#stretchMode() === 'all' && remainingSize > 0) {
      this.stretchAllRatio = totalWidth / sumAll;
      this.stretchAllColumnsWidth = [];
      this.needVerifyLastColumnWidth = true;

    } else if (this.#stretchMode() === 'last' && totalWidth !== Infinity) {
      const columnWidth = this._getColumnWidth(this.#totalColumns() - 1);
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

    if (this.#stretchMode() === 'all' && this.stretchAllRatio !== 0) {
      result = this._getStretchedAllColumnWidth(column, baseWidth);

    } else if (this.#stretchMode() === 'last' && this.stretchLastWidth !== 0) {
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

    if (!this.stretchAllColumnsWidth[column]) {
      const stretchedWidth = Math.round(baseWidth * this.stretchAllRatio);
      const newStretchedWidth = this.#stretchingColumnWidthFn(stretchedWidth, column);

      if (newStretchedWidth === undefined) {
        this.stretchAllColumnsWidth[column] = stretchedWidth;
      } else {
        this.stretchAllColumnsWidth[column] = isNaN(newStretchedWidth)
          ? this._getColumnWidth(column) : newStretchedWidth;
      }
    }

    if (this.stretchAllColumnsWidth.length === this.#totalColumns() && this.needVerifyLastColumnWidth) {
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
    if (column === this.#totalColumns() - 1) {
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
    let width = this.#columnWidthFn(column);

    if (isNaN(width)) {
      width = DEFAULT_COLUMN_WIDTH;
    }

    return width;
  }
}
