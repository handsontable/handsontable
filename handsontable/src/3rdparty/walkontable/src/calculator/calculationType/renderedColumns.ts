import type { ViewportColumnsCalculator } from '../viewportColumns';
import { PartiallyVisibleColumnsCalculationType } from './partiallyVisibleColumns';

/**
 * @class RenderedColumnsCalculationType
 */
export class RenderedColumnsCalculationType extends PartiallyVisibleColumnsCalculationType {
  /**
   * The property holds the offset applied in the `overrideFn` function to the `startColumn` value.
   *
   * @type {number}
   */
  columnStartOffset: number = 0;
  /**
   * The property holds the offset applied in the `overrideFn` function to the `endColumn` value.
   *
   * @type {number}
   */
  columnEndOffset: number = 0;
  /**
   * The horizontal scroll offset (zero-based, in px) the band was computed at. Read on the next
   * scroll-driven draw by `applyRenderedColumnsBandOverscan` (`viewport/calculatorFactory.ts`): the
   * sign of the offset delta between two consecutive full draws picks the band side that receives
   * the directional overscan. The value is clamped to zero and derived from an absolute scroll
   * position, so the comparison works the same in LTR and RTL.
   *
   * @type {number}
   */
  scrollOffset: number = 0;

  /**
   * Finalizes the calculation.
   *
   * @param {ViewportColumnsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator: ViewportColumnsCalculator): void {
    super.finalize(viewportCalculator);

    const {
      overrideFn,
      totalColumns,
      positionCache,
    } = viewportCalculator;

    this.scrollOffset = viewportCalculator.zeroBasedScrollOffset;

    if (this.startColumn !== null && typeof overrideFn === 'function') {
      const startColumn = this.startColumn;
      const endColumn = this.endColumn;

      overrideFn(this);

      this.columnStartOffset = startColumn - this.startColumn;
      this.columnEndOffset = this.endColumn !== null && endColumn !== null ? this.endColumn - endColumn : 0;
    }

    if (this.startColumn !== null && this.startColumn < 0) {
      this.startColumn = 0;
    }

    this.startPosition = this.startColumn !== null && positionCache ? positionCache.getOffset(this.startColumn) : null;

    if (this.endColumn !== null && totalColumns < this.endColumn) {
      this.endColumn = totalColumns - 1;
    }

    if (this.startColumn !== null && this.endColumn !== null) {
      this.count = this.endColumn - this.startColumn + 1;
    }
  }
}
