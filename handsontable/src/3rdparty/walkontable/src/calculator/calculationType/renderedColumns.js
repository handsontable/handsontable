import { PartiallyVisibleColumnsCalculationType } from './partiallyVisibleColumns';

/**
 * @class RenderedColumnsCalculationType
 */
export class RenderedColumnsCalculationType extends PartiallyVisibleColumnsCalculationType {
  /**
   * Finalizes the calculation.
   *
   * @param {ViewportColumnsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator) {
    super.finalize(viewportCalculator);

    const {
      overrideFn,
      totalColumns,
      startPositions,
    } = viewportCalculator;

    if (this.startColumn !== null && typeof overrideFn === 'function') {
      overrideFn(this);
    }

    if (this.startColumn < 0) {
      this.startColumn = 0;
    }

    this.startPosition = startPositions[this.startColumn] ?? null;

    if (totalColumns < this.endColumn) {
      this.endColumn = totalColumns - 1;
    }

    if (this.startColumn !== null) {
      this.count = this.endColumn - this.startColumn + 1;
    }
  }
}
