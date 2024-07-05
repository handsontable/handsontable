/**
 * @typedef {object} RenderedAllColumnsCalculatorOptions
 * @property {number} totalColumns Total number of columns.
 */
/**
 * Holds all calculations needed to perform the rendering of all columns.
 *
 * @class RenderedAllColumnsCalculationType
 */
export class RenderedAllColumnsCalculationType {
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
   * Determines if the viewport is visible in the trimming container.
   *
   * @type {boolean}
   */
  isVisibleInTrimmingContainer = false;

  initialize() {}
  process() {}
  finalize() {}
}
