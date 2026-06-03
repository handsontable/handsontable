import type from '../utils/positionCache';
import type from './axisCalculation';
import from './axisCalculation';
import type from './viewportBase';
import from './viewportBase';

/**
 * @typedef ViewportRowsCalculatorOptions
 * @property calculationTypes The calculation types to be performed.
 * @property viewportHeight Height of the viewport.
 * @property scrollOffset Current vertical scroll position of the viewport.
 * @property totalRows Total number of rows.
 * @property overrideFn Function that allows to adjust the `startRow` and `endRow` parameters.
 * @property horizontalScrollbarHeight The scrollbar height.
 * @property rowHeightCache A built prefix sum cache. The single source of truth for row sizes.
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
  /**
   * The total height of the viewport in pixels.
   */
  viewportHeight: number = 0;
  /**
   * The current vertical scroll offset of the viewport in pixels.
   */
  scrollOffset: number = 0;
  /**
   * The scroll offset clamped to a minimum of zero, used for index calculations.
   */
  zeroBasedScrollOffset: number = 0;
  /**
   * The total number of rows in the data source.
   */
  totalRows: number = 0;
  /**
   * The height of the most recently measured row in pixels.
   */
  rowHeight: number = 0;
  /**
   * An optional function that receives the calculator context and can adjust start and end row indexes.
   */
  overrideFn: ((calc: unknown) => void) | null = null;
  /**
   * The height of the horizontal scrollbar in pixels, subtracted from the available viewport height.
   */
  horizontalScrollbarHeight: number = 0;
  /**
   * The bottom boundary of the visible viewport in pixels, accounting for scroll and scrollbar height.
   */
  innerViewportHeight: number = 0;
  /**
   * The cumulative height of all rows rendered so far during a calculation pass.
   */
  totalCalculatedHeight: number = 0;
  /**
   * Indicates that the render order should be reversed during axis traversal when needed.
   */
  needReverse: boolean = true;
  /**
   * The position cache providing row height and cumulative offset data.
   */
  positionCache: PositionCache | null = null;
  /**
   * The index of the last row processed during the most recent calculation pass.
   */
  lastProcessedIndex: number = -1;

  /**
   * @param options Object with all options specified for row viewport calculation.
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
      setSizeField: (ctx, size) => {
        ctx.rowHeight = size;
      },
      setTotalCalculated: (ctx, v) => {
        ctx.totalCalculatedHeight = v;
      },
      getTotalCalculated: ctx => ctx.totalCalculatedHeight as number,
    });
  }

  /**
   * @param calculatorId The id of the calculator.
   * @returns 
   */
  getResultsFor(calculatorId: string): (RowsCalculationType & CalculationTypeLike) | undefined {
    return this.calculationResults.get(calculatorId) as (RowsCalculationType & CalculationTypeLike) | undefined;
  }

  /**
   * Gets the row height at the specified row index.
   *
   * @param row Row index.
   * @returns 
   */
  getRowHeight(row: number): number {
    return this.positionCache?.getSizeAt(row) ?? 0;
  }
}
