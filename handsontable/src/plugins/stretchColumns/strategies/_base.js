/**
 * The base strategy stretching strategy to extend from.
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
   * The map that stores the calculated column widths.
   *
   * @type {Map<number, number>}
   */
  widths = new Map();

  /**
   * Prepares the strategy for the calculation.
   *
   * @param {{ viewportWidth: number, allColumnsWidth: number }} calcArgs The calculation arguments.
   */
  prepare({ viewportWidth, allColumnsWidth }) {
    this.viewportWidth = viewportWidth;
    this.allColumnsWidth = allColumnsWidth;
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
