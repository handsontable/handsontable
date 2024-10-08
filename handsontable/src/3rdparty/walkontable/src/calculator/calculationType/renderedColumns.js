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
  columnStartOffset = 0;
  /**
   * The property holds the offset applied in the `overrideFn` function to the `endColumn` value.
   *
   * @type {number}
   */
  columnEndOffset = 0;

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
      const startColumn = this.startColumn;
      const endColumn = this.endColumn;

      overrideFn(this);

      this.columnStartOffset = startColumn - this.startColumn;
      this.columnEndOffset = this.endColumn - endColumn;
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
