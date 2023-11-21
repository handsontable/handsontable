/**
 * @typedef {object} RenderAllColumnsCalculatorOptions
 * @property {number} totalColumns Total number of columns.
 */
/**
 * Holds all calculations needed to perform rendering of the all columns.
 *
 * @class RenderAllColumnsCalculator
 */
class RenderAllColumnsCalculator {
  /**
   * Number of rendered/visible columns.
   *
   * @type {number}
   */
  count = 0;
  /**
   * Index of the first rendered/visible row (can be overwritten using overrideFn).
   *
   * @type {number}
   */
  startColumn = 0;
  /**
   * Index of the last rendered/visible row (can be overwritten using overrideFn).
   *
   * @type {number}
   */
  endColumn = 0;
  /**
   * Position of the first rendered/visible row (in px).
   *
   * @type {number}
   */
  startPosition = 0;

  /**
   * @param {RenderAllColumnsCalculatorOptions} options Object with all options specified for row viewport calculation.
   */
  constructor(options) {
    this.count = options.totalColumns
    this.endCol = this.count - 1;
  }
}

export default RenderAllColumnsCalculator;
