/**
 * @typedef StretchStrategyCalcArgs
 * @property {number} viewportWidth The width of the viewport.
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

  constructor(overwriteColumnWidthFn) {
    this.overwriteColumnWidthFn = overwriteColumnWidthFn;
  }

  /**
   * Prepares the strategy for the calculation.
   *
   * @param {StretchStrategyCalcArgs} calcArgs The calculation arguments.
   */
  prepare({ viewportWidth }) {
    this.viewportWidth = viewportWidth;
    this.widths.clear();
  }

  /**
   * Sets the widths of the columns with which the strategy will work.
   *
   * @param {number} columnVisualIndex The visual index of the column.
   * @param {number} columnWidth The width of the column.
   */
  setColumnWidthBase(columnVisualIndex, columnWidth) {
    this.widths.set(columnVisualIndex, columnWidth);
  }

  /**
   * Calculates the width of the column.
   */
  calculate() {}

  /**
   * Gets the calculated column widths.
   *
   * @returns {Array<number[]>}
   */
  getWidths() {
    return Array.from(this.widths);
  }
}
