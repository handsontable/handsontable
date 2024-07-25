/**
 * @typedef {object} ColumnsCalculationType
 * @property {number | null} startColumn The column index of the first column in the viewport.
 * @property {number | null} endColumn The column index of the last column in the viewport.
 * @property {number} count Total number of columns.
 * @property {number | null} startPosition Position of the first fully column (in px).
 * @property {boolean} isVisibleInTrimmingContainer Determines if the viewport is visible in the trimming container.
 */
/**
 * @typedef {object} RowsCalculationType
 * @property {number | null} startRow The row index of the first row in the viewport.
 * @property {number | null} endRow The row index of the last row in the viewport.
 * @property {number} count Total number of rows.
 * @property {number | null} startPosition Position of the first fully row (in px).
 * @property {boolean} isVisibleInTrimmingContainer Determines if the viewport is visible in the trimming container.
 */
/**
 * @class ViewportBaseCalculator
 */
export class ViewportBaseCalculator {
  /**
   * The calculation types to be performed.
   *
   * @type {Array}
   */
  calculationTypes = [];
  /**
   * The calculation results.
   *
   * @type {Map<string, ColumnsCalculationType | RowsCalculationType>}
   */
  calculationResults = new Map();

  constructor(calculationTypes) {
    this.calculationTypes = calculationTypes;
  }

  /**
   * Initializes all calculators (triggers all calculators before calculating the rows/columns sizes).
   *
   * @param {*} context The context object (rows or columns viewport calculator).
   */
  _initialize(context) {
    this.calculationTypes.forEach(([id, calculator]) => {
      this.calculationResults.set(id, calculator);
      calculator.initialize(context);
    });
  }

  /**
   * Processes the row/column at the given index.
   *
   * @param {number} index The index of the row/column.
   * @param {*} context The context object (rows or columns viewport calculator).
   */
  _process(index, context) {
    this.calculationTypes.forEach(([, calculator]) => calculator.process(index, context));
  }

  /**
   * Finalizes all calculators (triggers all calculators after calculating the rows/columns sizes).
   *
   * @param {*} context The context object (rows or columns viewport calculator).
   */
  _finalize(context) {
    this.calculationTypes.forEach(([, calculator]) => calculator.finalize(context));
  }

  /**
   * Gets the results for the given calculator.
   *
   * @param {string} calculatorId The id of the calculator.
   * @returns {ColumnsCalculationType | RowsCalculationType}
   */
  getResultsFor(calculatorId) {
    return this.calculationResults.get(calculatorId);
  }
}
