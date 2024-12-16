import { ViewportBaseCalculator } from './viewportBase';

/**
 * @typedef {object} ViewportRowsCalculatorOptions
 * @property {Map<string, ViewportBaseCalculator>} calculationTypes The calculation types to be performed.
 * @property {number} viewportHeight Height of the viewport.
 * @property {number} scrollOffset Current vertical scroll position of the viewport.
 * @property {number} totalRows Total number of rows.
 * @property {Function} rowHeightFn Function that returns the height of the row at a given index (in px).
 * @property {Function} overrideFn Function that allows to adjust the `startRow` and `endRow` parameters.
 * @property {number} horizontalScrollbarHeight The scrollbar height.
 */
/**
 * Calculates indexes of rows to render OR rows that are visible OR partially visible in the viewport.
 *
 * @class ViewportRowsCalculator
 */
export class ViewportRowsCalculator extends ViewportBaseCalculator {
  viewportHeight = 0;
  scrollOffset = 0;
  zeroBasedScrollOffset = 0;
  totalRows = 0;
  rowHeightFn = null;
  rowHeight = 0;
  overrideFn = null;
  horizontalScrollbarHeight = 0;
  innerViewportHeight = 0;
  totalCalculatedHeight = 0;
  startPositions = [];
  needReverse = true;

  /**
   * @param {ViewportRowsCalculatorOptions} options Object with all options specified for row viewport calculation.
   */
  constructor({
    calculationTypes,
    viewportHeight,
    scrollOffset,
    totalRows,
    defaultRowHeight,
    rowHeightFn,
    overrideFn,
    horizontalScrollbarHeight,
  }) {
    super(calculationTypes);
    this.defaultHeight = defaultRowHeight;
    this.viewportHeight = viewportHeight;
    this.scrollOffset = scrollOffset;
    this.zeroBasedScrollOffset = Math.max(scrollOffset, 0);
    this.totalRows = totalRows;
    this.rowHeightFn = rowHeightFn;
    this.overrideFn = overrideFn;
    this.horizontalScrollbarHeight = horizontalScrollbarHeight ?? 0;
    this.innerViewportHeight = this.zeroBasedScrollOffset + this.viewportHeight - this.horizontalScrollbarHeight;

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate() {
    this._initialize(this);

    for (let row = 0; row < this.totalRows; row++) {
      this.rowHeight = this.getRowHeight(row);

      this._process(row, this);

      this.startPositions.push(this.totalCalculatedHeight);
      this.totalCalculatedHeight += this.rowHeight;

      if (this.totalCalculatedHeight >= this.innerViewportHeight) {
        this.needReverse = false;
        break;
      }
    }

    this._finalize(this);
  }

  /**
   * Gets the row height at the specified row index.
   *
   * @param {number} row Row index.
   * @returns {number}
   */
  getRowHeight(row) {
    const rowHeight = this.rowHeightFn(row);

    if (isNaN(rowHeight)) {
      return this.defaultHeight;
    }

    return rowHeight;
  }
}
