import type { PositionCache } from '../utils/positionCache';
import { calculateAxis, AxisCalculatorContext } from './axisCalculation';
import { ViewportBaseCalculator, CalculationTypeLike, ColumnsCalculationType } from './viewportBase';

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
export interface ViewportColumnsCalculatorOptions {
  calculationTypes: Array<[string, CalculationTypeLike]>;
  viewportWidth: number;
  scrollOffset: number;
  totalColumns: number;
  overrideFn: ((calc: unknown) => void) | null;
  inlineStartOffset: number;
  columnWidthCache: PositionCache;
}

/**
 * Calculates indexes of columns to render OR columns that are visible OR partially visible in the viewport.
 *
 * @class ViewportColumnsCalculator
 */
export class ViewportColumnsCalculator extends ViewportBaseCalculator {
  viewportWidth: number = 0;
  scrollOffset: number = 0;
  zeroBasedScrollOffset: number = 0;
  totalColumns: number = 0;
  columnWidth: number = 0;
  overrideFn: ((calc: unknown) => void) | null = null;
  inlineStartOffset: number = 0;
  totalCalculatedWidth: number = 0;
  needReverse: boolean = true;
  positionCache: PositionCache = null;
  lastProcessedIndex: number = -1;

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
  }: ViewportColumnsCalculatorOptions) {
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
  calculate(): void {
    calculateAxis(this as unknown as AxisCalculatorContext, {
      totalCount: this.totalColumns,
      zeroBasedScrollOffset: this.zeroBasedScrollOffset,
      scrollEnd: this.zeroBasedScrollOffset + this.viewportWidth,
      positionCache: this.positionCache,
      setSizeField: (ctx, size) => { ctx.columnWidth = size; },
      setTotalCalculated: (ctx, v) => { ctx.totalCalculatedWidth = v; },
      getTotalCalculated: ctx => ctx.totalCalculatedWidth as number,
    });
  }

  /**
   * @param {string} calculatorId The id of the calculator.
   * @returns {ColumnsCalculationType | undefined}
   */
  getResultsFor(calculatorId: string): (ColumnsCalculationType & CalculationTypeLike) | undefined {
    return this.calculationResults.get(calculatorId) as (ColumnsCalculationType & CalculationTypeLike) | undefined;
  }

  /**
   * Gets the column width at the specified column index.
   *
   * @param {number} column Column index.
   * @returns {number}
   */
  getColumnWidth(column: number): number {
    return this.positionCache.getSizeAt(column);
  }
}
