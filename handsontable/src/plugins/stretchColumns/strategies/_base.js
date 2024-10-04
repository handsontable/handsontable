/**
 * @typedef StretchStrategyCalcArgs
 * @property {number} viewportWidth The width of the viewport.
 * @property {number} allColumnsWidth The sum of all columns' widths.
 * @property {function(number, number): number | undefined} overwriteColumnWidthFn The function to overwrite the column width.
 */
/**
 * The base strategy stretching strategy to extend from.
 *
 * @private
 * @class StretchStrategy
 */
export class StretchStrategy {
  /**
   * The width of the viewport.
   *
   * @type {number}
   */
  viewportWidth;
  /**
   * The sum of all columns' widths.
   *
   * @type {number}
   */
  allColumnsWidth;
  /**
   * The function to overwrite the column width.
   *
   * @type {function(number, number): number | undefined}
   */
  overwriteColumnWidthFn;
  /**
   * The map that stores the calculated column widths.
   *
   * @type {Map<number, number>}
   */
  widths = new Map();

  /**
   * Prepares the strategy for the calculation.
   *
   * @param {StretchStrategyCalcArgs} calcArgs The calculation arguments.
   */
  prepare({ viewportWidth, allColumnsWidth, overwriteColumnWidthFn }) {
    this.viewportWidth = viewportWidth;
    this.allColumnsWidth = allColumnsWidth;
    this.overwriteColumnWidthFn = overwriteColumnWidthFn;
    this.widths.clear();
  }

  /**
   * Calculates the width of the column.
   */
  calculate() {}

  /**
   * Finishes the calculation.
   */
  finish() {}

  /**
   * Gets the calculated column widths.
   *
   * @returns {Array<number[]>}
   */
  getWidths() {
    return Array.from(this.widths);
  }
}
