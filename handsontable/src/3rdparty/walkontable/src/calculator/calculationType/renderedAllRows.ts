import { RowsCalculationType, CalculatorContext } from '../../types';

/**
 * @typedef {object} RenderedAllRowsCalculatorOptions
 * @property {number} totalRows Total number of rows.
 */
/**
 * Holds all calculations needed to perform the rendering of all rows.
 *
 * @class RenderedAllRowsCalculationType
 */
export class RenderedAllRowsCalculationType implements RowsCalculationType {
  /**
   * Number of rendered/visible rows.
   *
   * @type {number}
   */
  count: number = 0;
  /**
   * Index of the first rendered/visible row.
   *
   * @type {number}
   */
  startRow: number = 0;
  /**
   * Index of the last rendered/visible row.
   *
   * @type {number}
   */
  endRow: number = 0;
  /**
   * Position of the first rendered/visible row (in px).
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
   * @param {ViewportRowsCalculator} viewportCalculator The viewport calculator object.
   */
  initialize(viewportCalculator: { totalRows: number }): void {
    this.count = viewportCalculator.totalRows;
    this.endRow = this.count - 1;
  }

  /**
   * Processes the row.
   */
  process(): void {}

  /**
   * Finalizes the calculation.
   */
  finalize(): void {}
}
