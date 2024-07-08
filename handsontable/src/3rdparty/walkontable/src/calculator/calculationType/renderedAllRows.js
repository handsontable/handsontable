/**
 * @typedef {object} RenderedAllRowsCalculatorOptions
 * @property {number} totalRows Total number of rows.
 */
/**
 * Holds all calculations needed to perform the rendering of all rows.
 *
 * @class RenderedAllRowsCalculationType
 */
export class RenderedAllRowsCalculationType {
  /**
   * Number of rendered/visible rows.
   *
   * @type {number}
   */
  count = 0;
  /**
   * Index of the first rendered/visible row.
   *
   * @type {number}
   */
  startRow = 0;
  /**
   * Index of the last rendered/visible row.
   *
   * @type {number}
   */
  endRow = 0;
  /**
   * Position of the first rendered/visible row (in px).
   *
   * @type {number}
   */
  startPosition = 0;
  /**
   * Determines if the viewport is visible in the trimming container.
   *
   * @type {boolean}
   */
  isVisibleInTrimmingContainer = true;

  /**
   * Initializes the calculation.
   *
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  initialize({ totalRows }) {
    this.count = totalRows;
    this.endRow = this.count - 1;
  }

  /**
   * Processes the row.
   */
  process() {}

  /**
   * Finalizes the calculation.
   */
  finalize() {}
}
