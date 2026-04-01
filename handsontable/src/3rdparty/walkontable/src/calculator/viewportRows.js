import { calculateAxis } from './axisCalculation';
import { ViewportBaseCalculator } from './viewportBase';

/**
 * @typedef {object} ViewportRowsCalculatorOptions
 * @property {Map<string, ViewportBaseCalculator>} calculationTypes The calculation types to be performed.
 * @property {number} viewportHeight Height of the viewport.
 * @property {number} scrollOffset Current vertical scroll position of the viewport.
 * @property {number} totalRows Total number of rows.
 * @property {Function} overrideFn Function that allows to adjust the `startRow` and `endRow` parameters.
 * @property {number} horizontalScrollbarHeight The scrollbar height.
 * @property {PositionCache} rowHeightCache A built prefix sum cache. The single source of truth for row sizes.
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
  rowHeight = 0;
  overrideFn = null;
  horizontalScrollbarHeight = 0;
  innerViewportHeight = 0;
  totalCalculatedHeight = 0;
  needReverse = true;

  /**
   * @param {ViewportRowsCalculatorOptions} options Object with all options specified for row viewport calculation.
   */
  constructor({
    calculationTypes,
    viewportHeight,
    scrollOffset,
    totalRows,
    overrideFn,
    horizontalScrollbarHeight,
    rowHeightCache,
  }) {
    super(calculationTypes);
    this.viewportHeight = viewportHeight;
    this.scrollOffset = scrollOffset;
    this.zeroBasedScrollOffset = Math.max(scrollOffset, 0);
    this.totalRows = totalRows;
    this.overrideFn = overrideFn;
    this.horizontalScrollbarHeight = horizontalScrollbarHeight ?? 0;
    this.innerViewportHeight = this.zeroBasedScrollOffset + this.viewportHeight - this.horizontalScrollbarHeight;
    this.positionCache = rowHeightCache;

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate() {
    calculateAxis(this, {
      totalCount: this.totalRows,
      zeroBasedScrollOffset: this.zeroBasedScrollOffset,
      scrollEnd: this.innerViewportHeight,
      positionCache: this.positionCache,
      setSizeField: (ctx, size) => { ctx.rowHeight = size; },
      setTotalCalculated: (ctx, v) => { ctx.totalCalculatedHeight = v; },
      getTotalCalculated: ctx => ctx.totalCalculatedHeight,
    });
  }

  /**
   * Gets the row height at the specified row index.
   *
   * @param {number} row Row index.
   * @returns {number}
   */
  getRowHeight(row) {
    return this.positionCache.getSizeAt(row);
  }
}
