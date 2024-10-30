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
   * The map that stores the base column widths.
   *
   * @type {Map<number, number>}
   */
  baseWidths = new Map();
  /**
   * The map that stores the calculated, stretched column widths.
   *
   * @type {Map<number, number>}
   */
  stretchedWidths = new Map();

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
    this.baseWidths.clear();
    this.stretchedWidths.clear();
  }

  /**
   * Sets the base widths of the columns with which the strategy will work with.
   *
   * @param {number} columnVisualIndex The visual index of the column.
   * @param {number} columnWidth The width of the column.
   */
  setColumnBaseWidth(columnVisualIndex, columnWidth) {
    this.baseWidths.set(columnVisualIndex, columnWidth);
  }

  /**
   * Calculates the width of the column.
   */
  calculate() {}

  /**
   * Gets the calculated stretched column widths.
   *
   * @returns {Array<number[]>}
   */
  getWidths() {
    return Array.from(this.stretchedWidths);
  }
}
