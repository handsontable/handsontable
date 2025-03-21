import { ViewportBaseCalculator } from './viewportBase';
import { CalculatorContext, CalculatorInstance } from '../types';

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
export interface ViewportColumnsCalculatorOptions {
  calculationTypes: Array<[string, CalculatorInstance]>;
  viewportWidth: number;
  scrollOffset: number;
  totalColumns: number;
  columnWidthFn: (column: number) => number;
  overrideFn?: ((calc: CalculatorContext) => void) | null;
  inlineStartOffset: number;
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
  columnWidthFn: ((column: number) => number) | null = null;
  columnWidth: number = 0;
  overrideFn: ((calc: CalculatorContext) => void) | null = null;
  inlineStartOffset: number = 0;
  totalCalculatedWidth: number = 0;
  startPositions: number[] = [];
  needReverse: boolean = true;

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
  }: ViewportColumnsCalculatorOptions) {
    super(calculationTypes);
    this.viewportWidth = viewportWidth;
    this.scrollOffset = scrollOffset;
    this.zeroBasedScrollOffset = Math.max(scrollOffset, 0);
    this.totalColumns = totalColumns;
    this.columnWidthFn = columnWidthFn;
    this.overrideFn = overrideFn ?? null;
    this.inlineStartOffset = inlineStartOffset;

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate(): void {
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
  getColumnWidth(column: number): number {
    if (!this.columnWidthFn) {
      return DEFAULT_WIDTH;
    }
    
    const width = this.columnWidthFn(column);

    if (isNaN(width)) {
      return DEFAULT_WIDTH;
    }

    return width;
  }
}
