import { ViewportBaseCalculator } from './viewportBase';

export const DEFAULT_WIDTH = 50;

/**
 * @typedef {object} ViewportColumnsCalculatorOptions
 * @property {Map<string, ViewportBaseCalculator>} calculationTypes The calculation types to be performed.
 * @property {number} viewportWidth Width of the viewport.
 * @property {number} scrollOffset Current horizontal scroll position of the viewport.
 * @property {number} totalColumns Total number of columns.
 * @property {Function} columnWidthFn Function that returns the width of the column at a given index (in px).
 * @property {Function} overrideFn Function that allows to adjust the `startRow` and `endRow` parameters.
 * @property {string} inlineStartOffset Inline-start offset of the parent container.
 */
/**
 * Calculates indexes of columns to render OR columns that are visible OR partially visible in the viewport.
 *
 * @class ViewportColumnsCalculator
 */
export class ViewportColumnsCalculator extends ViewportBaseCalculator {
  viewportWidth = 0;
  scrollOffset = 0;
  zeroBasedScrollOffset = 0;
  totalColumns = 0;
  columnWidthFn = null;
  columnWidth = 0;
  overrideFn = null;
  inlineStartOffset = 0;
  totalCalculatedWidth = 0;
  startPositions = [];
  needReverse = true;

  /**
   * @param {ViewportColumnsCalculatorOptions} options Object with all options specified for column viewport calculation.
   */
  constructor({
    calculationTypes,
    viewportWidth,
    scrollOffset,
    totalColumns,
    columnWidthFn,
    overrideFn,
    inlineStartOffset,
  }) {
    super(calculationTypes);
    this.viewportWidth = viewportWidth;
    this.scrollOffset = scrollOffset;
    this.zeroBasedScrollOffset = Math.max(scrollOffset, 0);
    this.totalColumns = totalColumns;
    this.columnWidthFn = columnWidthFn;
    this.overrideFn = overrideFn;
    this.inlineStartOffset = inlineStartOffset;

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate() {
    this._initialize(this);

    for (let column = 0; column < this.totalColumns; column++) {
      this.columnWidth = this.getColumnWidth(column);

      this._process(column, this);

      this.startPositions.push(this.totalCalculatedWidth);
      this.totalCalculatedWidth += this.columnWidth;

      if (this.totalCalculatedWidth >= this.zeroBasedScrollOffset + this.viewportWidth) {
        this.needReverse = false;
        break;
      }
    }

    this._finalize(this);
  }

  /**
   * Gets the column width at the specified column index.
   *
   * @param {number} column Column index.
   * @returns {number}
   */
  getColumnWidth(column) {
    const width = this.columnWidthFn(column);

    if (isNaN(width)) {
      return DEFAULT_WIDTH;
    }

    return width;
  }
}
