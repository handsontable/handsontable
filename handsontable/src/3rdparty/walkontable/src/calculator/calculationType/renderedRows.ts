import { PartiallyVisibleRowsCalculationType } from './partiallyVisibleRows';
import { RowsCalculationType, CalculatorContext } from '../../types';

/**
 * @class RenderedRowsCalculationType
 */
export class RenderedRowsCalculationType extends PartiallyVisibleRowsCalculationType implements RowsCalculationType {
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
   * Finalizes the calculation.
   *
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator: CalculatorContext): void {
    super.finalize(viewportCalculator);

    const {
      overrideFn,
      totalRows,
      startPositions,
    } = viewportCalculator;

    if (this.startRow !== null && typeof overrideFn === 'function') {
      const startRow = this.startRow;
      const endRow = this.endRow;

      overrideFn(this);

      if (this.startRow !== null) {
        this.rowStartOffset = startRow - this.startRow;
      }
      
      if (endRow !== null && this.endRow !== null) {
        this.rowEndOffset = this.endRow - endRow;
      }
    }

    if (this.startRow !== null && this.startRow < 0) {
      this.startRow = 0;
    }

    if (this.startRow !== null) {
      this.startPosition = startPositions[this.startRow] ?? null;
    }

    if (this.endRow !== null && totalRows < this.endRow) {
      this.endRow = totalRows - 1;
    }

    if (this.startRow !== null && this.endRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}
