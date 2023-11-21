/**
 * @typedef {object} RenderAllRowsCalculatorOptions
 * @property {number} totalRows Total number of rows.
 */
/**
 * Holds all calculations needed to perform rendering of the all rows.
 *
 * @class RenderAllRowsCalculator
 */
class RenderAllRowsCalculator {
  /**
   * Number of rendered/visible rows.
   *
   * @type {number}
   */
  count = 0;
  /**
   * Index of the first rendered/visible row (can be overwritten using overrideFn).
   *
   * @type {number}
   */
  startRow = 0;
  /**
   * Index of the last rendered/visible row (can be overwritten using overrideFn).
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
   * @param {RenderAllRowsCalculatorOptions} options Object with all options specified for row viewport calculation.
   */
  constructor(options) {
    this.count = options.totalRows
    this.endRow = this.count - 1;
  }
}

export default RenderAllRowsCalculator;
