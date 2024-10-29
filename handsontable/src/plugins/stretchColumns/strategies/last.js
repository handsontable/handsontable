import { StretchStrategy } from './_base';

/**
 * @typedef StretchStrategyCalcArgs
 * @property {number} viewportWidth The width of the viewport.
 */
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
   * @param {StretchStrategyCalcArgs} calcArgs The calculation arguments.
   */
  prepare(calcArgs) {
    super.prepare(calcArgs);
    this.#lastColumnWidth = 0;
    this.#lastColumnIndex = -1;
  }

  /**
   * Sets the base widths of the columns with which the strategy will work with.
   *
   * @param {number} columnVisualIndex The visual index of the column.
   * @param {number} columnWidth The width of the column.
   */
  setColumnBaseWidth(columnVisualIndex, columnWidth) {
    super.setColumnBaseWidth(columnVisualIndex, columnWidth);
    this.#lastColumnIndex = columnVisualIndex;
    this.#lastColumnWidth = columnWidth;
  }

  /**
   * Calculates the columns widths.
   */
  calculate() {
    if (this.#lastColumnIndex === -1) {
      return;
    }

    const allColumnsWidth = Array.from(this.baseWidths).reduce((sum, [, width]) => sum + width, 0);
    const lastColumnWidth = Math.max(this.viewportWidth - allColumnsWidth + this.#lastColumnWidth, 0);

    this.stretchedWidths.set(this.#lastColumnIndex, lastColumnWidth);
  }
}
