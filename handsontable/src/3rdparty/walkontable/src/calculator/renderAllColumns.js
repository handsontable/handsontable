/**
 * @typedef {object} RenderAllColumnsCalculatorOptions
 * @property {number} totalColumns Total number of columns.
 */
/**
 * Holds all calculations needed to perform the rendering of all columns.
 *
 * @class RenderAllColumnsCalculator
 */
export class RenderAllColumnsCalculator {
  /**
   * Number of rendered/visible columns.
   *
   * @type {number}
   */
  count = 0;
  /**
   * Index of the first rendered/visible column.
   *
   * @type {number}
   */
  startColumn = 0;
  /**
   * Index of the last rendered/visible column.
   *
   * @type {number}
   */
  endColumn = 0;
  /**
   * Position of the first rendered/visible column (in px).
   *
   * @type {number}
   */
  startPosition = 0;

  /**
   * @param {RenderAllColumnsCalculatorOptions} options Object with all options specified for column viewport calculation.
   */
  constructor(options) {
    this.count = options.totalColumns;
    this.endColumn = this.count - 1;
  }
}
