import type { PositionCache } from '../utils/positionCache';
import { calculateAxis, AxisCalculatorContext } from './axisCalculation';
import { ViewportBaseCalculator, CalculationTypeLike, RowsCalculationType } from './viewportBase';

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
export interface ViewportRowsCalculatorOptions {
  calculationTypes: Array<[string, CalculationTypeLike]>;
  viewportHeight: number;
  scrollOffset: number;
  totalRows: number;
  overrideFn: ((calc: unknown) => void) | null;
  horizontalScrollbarHeight?: number;
  rowHeightCache: PositionCache;
}

/**
 * Calculates indexes of rows to render OR rows that are visible OR partially visible in the viewport.
 *
 * @class ViewportRowsCalculator
 */
export class ViewportRowsCalculator extends ViewportBaseCalculator {
  viewportHeight: number = 0;
  scrollOffset: number = 0;
  zeroBasedScrollOffset: number = 0;
  totalRows: number = 0;
  rowHeight: number = 0;
  overrideFn: ((calc: unknown) => void) | null = null;
  horizontalScrollbarHeight: number = 0;
  innerViewportHeight: number = 0;
  totalCalculatedHeight: number = 0;
  needReverse: boolean = true;
  positionCache: PositionCache | null = null;
  lastProcessedIndex: number = -1;

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
  }: ViewportRowsCalculatorOptions) {
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
  calculate(): void {
    if (!this.positionCache) {
      return;
    }

    calculateAxis(this as unknown as AxisCalculatorContext, {
      totalCount: this.totalRows,
      zeroBasedScrollOffset: this.zeroBasedScrollOffset,
      scrollEnd: this.innerViewportHeight,
      positionCache: this.positionCache,
      setSizeField: (ctx, size) => { ctx.rowHeight = size; },
      setTotalCalculated: (ctx, v) => { ctx.totalCalculatedHeight = v; },
      getTotalCalculated: ctx => ctx.totalCalculatedHeight as number,
    });
  }

  /**
   * @param {string} calculatorId The id of the calculator.
   * @returns {RowsCalculationType | undefined}
   */
  getResultsFor(calculatorId: string): (RowsCalculationType & CalculationTypeLike) | undefined {
    return this.calculationResults.get(calculatorId) as (RowsCalculationType & CalculationTypeLike) | undefined;
  }

  /**
   * Gets the row height at the specified row index.
   *
   * @param {number} row Row index.
   * @returns {number}
   */
  getRowHeight(row: number): number {
    return this.positionCache?.getSizeAt(row) ?? 0;
  }
}
