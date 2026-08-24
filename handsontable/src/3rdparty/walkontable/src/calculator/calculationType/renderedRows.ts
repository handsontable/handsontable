import type { ViewportRowsCalculator } from '../viewportRows';
import { PartiallyVisibleRowsCalculationType } from './partiallyVisibleRows';

/**
 * @class RenderedRowsCalculationType
 */
export class RenderedRowsCalculationType extends PartiallyVisibleRowsCalculationType {
  /**
   * The property holds the offset applied in the `overrideFn` function to the `startColumn` value.
   *
   * @type {number}
   */
  rowStartOffset: number = 0;
  /**
   * The property holds the offset applied in the `overrideFn` function to the `endColumn` value.
   *
   * @type {number}
   */
  rowEndOffset: number = 0;
  /**
   * The vertical scroll offset (zero-based, in px) the band was computed at. Read on the next
   * scroll-driven draw by `applyRenderedRowsBandOverscan` (`viewport/calculatorFactory.ts`): the sign
   * of the offset delta between two consecutive full draws picks the band side that receives the
   * directional overscan.
   *
   * @type {number}
   */
  scrollOffset: number = 0;

  /**
   * Finalizes the calculation.
   *
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator: ViewportRowsCalculator): void {
    super.finalize(viewportCalculator);

    const {
      overrideFn,
      totalRows,
      positionCache,
    } = viewportCalculator;

    this.scrollOffset = viewportCalculator.zeroBasedScrollOffset;

    if (this.startRow !== null && typeof overrideFn === 'function') {
      const startRow = this.startRow;
      const endRow = this.endRow;

      overrideFn(this);

      this.rowStartOffset = startRow - this.startRow;
      this.rowEndOffset = this.endRow !== null && endRow !== null ? this.endRow - endRow : 0;
    }

    if (this.startRow !== null && this.startRow < 0) {
      this.startRow = 0;
    }

    this.startPosition = this.startRow !== null && positionCache ? positionCache.getOffset(this.startRow) : null;

    if (this.endRow !== null && totalRows < this.endRow) {
      this.endRow = totalRows - 1;
    }

    if (this.startRow !== null && this.endRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}
