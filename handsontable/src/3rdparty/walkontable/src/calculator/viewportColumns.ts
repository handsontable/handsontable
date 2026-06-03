import type from '../utils/positionCache';
import type from './axisCalculation';
import from './axisCalculation';
import type from './viewportBase';
import from './viewportBase';

/**
 * @typedef ViewportColumnsCalculatorOptions
 * @property calculationTypes The calculation types to be performed.
 * @property viewportWidth Width of the viewport.
 * @property scrollOffset Current horizontal scroll position of the viewport.
 * @property totalColumns Total number of columns.
 * @property overrideFn Function that allows to adjust the `startRow` and `endRow` parameters.
 * @property inlineStartOffset Inline-start offset of the parent container.
 * @property columnWidthCache A built prefix sum cache. The single source of truth for column sizes.
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
  /**
   * Width of the visible viewport area in pixels, excluding row header width.
   */
  viewportWidth: number = 0;
  /**
   * Horizontal scroll offset of the viewport in pixels. May be negative when scrolled in RTL mode.
   */
  scrollOffset: number = 0;
  /**
   * Horizontal scroll offset normalized to a non-negative value, used as the axis start for calculations.
   */
  zeroBasedScrollOffset: number = 0;
  /**
   * Total number of columns in the data source.
   */
  totalColumns: number = 0;
  /**
   * Width in pixels of the column being processed during axis calculation.
   */
  columnWidth: number = 0;
  /**
   * Optional function that allows external code to adjust the calculated start or end column index.
   */
  overrideFn: ((calc: unknown) => void) | null = null;
  /**
   * Pixel offset of the inline-start edge of the parent container relative to the viewport origin.
   */
  inlineStartOffset: number = 0;
  /**
   * Sum of all column widths processed so far during a single calculation pass.
   */
  totalCalculatedWidth: number = 0;
  /**
   * Flag used by the axis calculation algorithm to indicate whether a reverse scan is needed.
   */
  needReverse: boolean = true;
  /**
   * Reference to the column width prefix sum cache used for O(log n) column lookups.
   */
  positionCache: PositionCache | null = null;
  /**
   * Index of the last column visited during the calculation pass.
   */
  lastProcessedIndex: number = -1;

  /**
   * @param options Object with all options specified for column viewport calculation.
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
    if (!this.positionCache) {
      return;
    }

    calculateAxis(this as unknown as AxisCalculatorContext, {
      totalCount: this.totalColumns,
      zeroBasedScrollOffset: this.zeroBasedScrollOffset,
      scrollEnd: this.zeroBasedScrollOffset + this.viewportWidth,
      positionCache: this.positionCache,
      setSizeField: (ctx, size) => {
        ctx.columnWidth = size;
      },
      setTotalCalculated: (ctx, v) => {
        ctx.totalCalculatedWidth = v;
      },
      getTotalCalculated: ctx => ctx.totalCalculatedWidth as number,
    });
  }

  /**
   * @param calculatorId The id of the calculator.
   * @returns 
   */
  getResultsFor(calculatorId: string): (ColumnsCalculationType & CalculationTypeLike) | undefined {
    return this.calculationResults.get(calculatorId) as (ColumnsCalculationType & CalculationTypeLike) | undefined;
  }

  /**
   * Gets the column width at the specified column index.
   *
   * @param column Column index.
   * @returns 
   */
  getColumnWidth(column: number): number {
    return this.positionCache?.getSizeAt(column) ?? 0;
  }
}
