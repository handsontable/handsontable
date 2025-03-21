import { ViewportBaseCalculator } from './viewportBase';
import { CalculatorContext, CalculatorInstance } from '../types';

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
export interface ViewportRowsCalculatorOptions {
  calculationTypes: Array<[string, CalculatorInstance]>;
  viewportHeight: number;
  scrollOffset: number;
  totalRows: number;
  defaultRowHeight: number;
  rowHeightFn: (row: number) => number;
  overrideFn?: ((calc: CalculatorContext) => void) | null;
  horizontalScrollbarHeight?: number;
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
  rowHeightFn: ((row: number) => number) | null = null;
  rowHeight: number = 0;
  overrideFn: ((calc: CalculatorContext) => void) | null = null;
  horizontalScrollbarHeight: number = 0;
  innerViewportHeight: number = 0;
  totalCalculatedHeight: number = 0;
  startPositions: number[] = [];
  needReverse: boolean = true;
  defaultHeight: number = 0;

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
  }: ViewportRowsCalculatorOptions) {
    super(calculationTypes);
    this.defaultHeight = defaultRowHeight;
    this.viewportHeight = viewportHeight;
    this.scrollOffset = scrollOffset;
    this.zeroBasedScrollOffset = Math.max(scrollOffset, 0);
    this.totalRows = totalRows;
    this.rowHeightFn = rowHeightFn;
    this.overrideFn = overrideFn ?? null;
    this.horizontalScrollbarHeight = horizontalScrollbarHeight ?? 0;
    this.innerViewportHeight = this.zeroBasedScrollOffset + this.viewportHeight - this.horizontalScrollbarHeight;

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate(): void {
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
  getRowHeight(row: number): number {
    if (!this.rowHeightFn) {
      return this.defaultHeight;
    }
    
    const rowHeight = this.rowHeightFn(row);

    if (isNaN(rowHeight)) {
      return this.defaultHeight;
    }

    return rowHeight;
  }
}
