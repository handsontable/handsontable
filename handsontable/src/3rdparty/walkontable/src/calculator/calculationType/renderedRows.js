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
  rowStartOffset = 0;
  /**
   * The property holds the offset applied in the `overrideFn` function to the `endColumn` value.
   *
   * @type {number}
   */
  rowEndOffset = 0;

  /**
   * Finalizes the calculation.
   *
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator) {
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

      this.rowStartOffset = startRow - this.startRow;
      this.rowEndOffset = this.endRow - endRow;
    }

    if (this.startRow < 0) {
      this.startRow = 0;
    }

    this.startPosition = startPositions[this.startRow] ?? null;

    if (totalRows < this.endRow) {
      this.endRow = totalRows - 1;
    }

    if (this.startRow !== null) {
      this.count = this.endRow - this.startRow + 1;
    }
  }
}
