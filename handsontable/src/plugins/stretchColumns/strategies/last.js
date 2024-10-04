import { StretchStrategy } from './_base';

/**
 * The strategy calculates only the last column widths to fill the viewport.
 *
 * @private
 * @class StretchLastStrategy
 */
export class StretchLastStrategy extends StretchStrategy {
  /**
   * The width of the last calculated column.
   *
   * @type {number}
   */
  #lastColumnWidth = 0;
  /**
   * The index of the last calculated column.
   *
   * @type {number}
   */
  #lastColumnIndex = -1;

  /**
   * Prepares the strategy for the calculation.
   *
   * @param {{ viewportWidth: number, allColumnsWidth: number }} calcArgs The calculation arguments.
   */
  prepare(calcArgs) {
    super.prepare(calcArgs);
    this.#lastColumnWidth = 0;
    this.#lastColumnIndex = -1;
  }

  /**
   * Calculates the width of the column.
   *
   * @param {number} columnVisualIndex The column visual index to calculate.
   * @param {number} columnWidth The current column width.
   */
  calculate(columnVisualIndex, columnWidth) {
    this.#lastColumnWidth = columnWidth;
    this.#lastColumnIndex = columnVisualIndex;
  }

  /**
   * Finishes the calculation.
   */
  finish() {
    if (this.#lastColumnIndex === -1) {
      return;
    }

    const lastColumnWidth = Math.max(this.viewportWidth - this.allColumnsWidth + this.#lastColumnWidth, 0);

    this.widths.set(this.#lastColumnIndex, lastColumnWidth);
  }
}
