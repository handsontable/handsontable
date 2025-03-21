import { PartiallyVisibleColumnsCalculationType } from './partiallyVisibleColumns';
import { ColumnsCalculationType, CalculatorContext } from '../../types';

/**
 * @class RenderedColumnsCalculationType
 */
export class RenderedColumnsCalculationType extends PartiallyVisibleColumnsCalculationType implements ColumnsCalculationType {
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
   * Finalizes the calculation.
   *
   * @param {ViewportColumnsCalculator} viewportCalculator The viewport calculator object.
   */
  finalize(viewportCalculator: CalculatorContext): void {
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

      if (this.startColumn !== null) {
        this.columnStartOffset = startColumn - this.startColumn;
      }
      
      if (endColumn !== null && this.endColumn !== null) {
        this.columnEndOffset = this.endColumn - endColumn;
      }
    }

    if (this.startColumn !== null && this.startColumn < 0) {
      this.startColumn = 0;
    }

    if (this.startColumn !== null) {
      this.startPosition = startPositions[this.startColumn] ?? null;
    }

    if (this.endColumn !== null && totalColumns < this.endColumn) {
      this.endColumn = totalColumns - 1;
    }

    if (this.startColumn !== null && this.endColumn !== null) {
      this.count = this.endColumn - this.startColumn + 1;
    }
  }
}
