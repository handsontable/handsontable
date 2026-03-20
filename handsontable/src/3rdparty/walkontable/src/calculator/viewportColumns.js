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
 * @property {PositionCache} [columnWidthCache] Optional prefix sum cache for O(log n) column lookups.
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
    columnWidthCache,
  }) {
    super(calculationTypes);
    this.viewportWidth = viewportWidth;
    this.scrollOffset = scrollOffset;
    this.zeroBasedScrollOffset = Math.max(scrollOffset, 0);
    this.totalColumns = totalColumns;
    this.columnWidthFn = columnWidthFn;
    this.overrideFn = overrideFn;
    this.inlineStartOffset = inlineStartOffset;
    this.columnWidthCache = columnWidthCache ?? null;

    this.calculate();
  }

  /**
   * Calculates viewport.
   */
  calculate() {
    this._initialize(this);

    // Use the prefix sum cache for O(log n) skip when available.
    // Falls back to iterating from column 0 when no cache is provided.
    let startColumn = 0;

    if (this.zeroBasedScrollOffset > 0 && this.totalColumns > 0) {
      if (this.columnWidthCache && this.columnWidthCache.isBuilt()) {
        const cachedCol = this.columnWidthCache.findIndexAtOffset(this.zeroBasedScrollOffset);

        startColumn = Math.max(0, cachedCol - 15);
        this.totalCalculatedWidth = this.columnWidthCache.getOffset(startColumn);

        if (startColumn > 0) {
          this.startPositions[startColumn - 1] = this.columnWidthCache.getOffset(startColumn - 1);
        }
      }
    }

    for (let column = startColumn; column < this.totalColumns; column++) {
      this.columnWidth = this.getColumnWidth(column);

      this._process(column, this);

      this.startPositions[column] = this.totalCalculatedWidth;
      this.totalCalculatedWidth += this.columnWidth;

      if (this.totalCalculatedWidth >= this.zeroBasedScrollOffset + this.viewportWidth) {
        this.needReverse = false;
        break;
      }
    }

    // When needReverse is true (all columns fit in viewport) and we skipped columns
    // via the cache, the startPositions array is sparse (indices 0..startColumn-1 are
    // undefined). The finalize/reverse walk needs these positions, so backfill them
    // from the cache.
    if (this.needReverse && startColumn > 0 && this.columnWidthCache && this.columnWidthCache.isBuilt()) {
      for (let i = 0; i < startColumn; i++) {
        this.startPositions[i] = this.columnWidthCache.getOffset(i);
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
