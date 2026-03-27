import { calculateAxis } from './axisCalculation';
import { ViewportBaseCalculator } from './viewportBase';

/**
 * @typedef {object} ViewportColumnsCalculatorOptions
 * @property {Map<string, ViewportBaseCalculator>} calculationTypes The calculation types to be performed.
 * @property {number} viewportWidth Width of the viewport.
 * @property {number} scrollOffset Current horizontal scroll position of the viewport.
 * @property {number} totalColumns Total number of columns.
 * @property {Function} overrideFn Function that allows to adjust the `startRow` and `endRow` parameters.
 * @property {string} inlineStartOffset Inline-start offset of the parent container.
 * @property {PositionCache} columnWidthCache A built prefix sum cache. The single source of truth for column sizes.
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
  columnWidth = 0;
  overrideFn = null;
  inlineStartOffset = 0;
  totalCalculatedWidth = 0;
  needReverse = true;

  /**
   * @param {ViewportColumnsCalculatorOptions} options Object with all options specified for column viewport calculation.
   */
  constructor({
    calculationTypes,
    viewportWidth,
    scrollOffset,
    totalColumns,
    overrideFn,
    inlineStartOffset,
    columnWidthCache,
  }) {
    super(calculationTypes);
    this.viewportWidth = viewportWidth;
    this.scrollOffset = scrollOffset;
    this.zeroBasedScrollOffset = Math.max(scrollOffset, 0);
    this.totalColumns = totalColumns;
    this.overrideFn = overrideFn;
    this.inlineStartOffset = inlineStartOffset;
    this.positionCache = columnWidthCache;

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate() {
    calculateAxis(this, {
      totalCount: this.totalColumns,
      zeroBasedScrollOffset: this.zeroBasedScrollOffset,
      scrollEnd: this.zeroBasedScrollOffset + this.viewportWidth,
      positionCache: this.positionCache,
      setSizeField: (ctx, size) => { ctx.columnWidth = size; },
      setTotalCalculated: (ctx, v) => { ctx.totalCalculatedWidth = v; },
      getTotalCalculated: ctx => ctx.totalCalculatedWidth,
    });
  }

  /**
   * Gets the column width at the specified column index.
   *
   * @param {number} column Column index.
   * @returns {number}
   */
  getColumnWidth(column) {
    return this.positionCache.getSizeAt(column);
  }
}
