import type { ViewportColumnsCalculator } from '../viewportColumns';

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
  count: number = 0;
  /**
   * Index of the first rendered/visible column.
   *
   * @type {number}
   */
  startColumn: number = 0;
  /**
   * Index of the last rendered/visible column.
   *
   * @type {number}
   */
  endColumn: number = 0;
  /**
   * Position of the first rendered/visible column (in px).
   *
   * @type {number}
   */
  startPosition: number = 0;
  /**
   * Determines if the viewport is visible in the trimming container.
   *
   * @type {boolean}
   */
  isVisibleInTrimmingContainer: boolean = true;

  /**
   * Initializes the calculation.
   *
   * @param {ViewportColumnsCalculator} viewportCalculator The viewport calculator object.
   */
  initialize({ totalColumns }: ViewportColumnsCalculator): void {
    this.count = totalColumns;
    this.endColumn = this.count - 1;
  }

  /**
   * Processes the column.
   */
  process(): void { // intentionally empty
  }

  /**
   * Finalizes the calculation.
   */
  finalize(): void { // intentionally empty
  }
}
