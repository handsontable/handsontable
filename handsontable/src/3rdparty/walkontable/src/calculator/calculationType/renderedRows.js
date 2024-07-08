import { PartiallyVisibleRowsCalculationType } from './partiallyVisibleRows';

/**
 * @class RenderedRowsCalculationType
 */
export class RenderedRowsCalculationType extends PartiallyVisibleRowsCalculationType {
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
      overrideFn(this);
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
