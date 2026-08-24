/**
 * @typedef {object} ColumnsCalculationType
 * @property {number | null} startColumn The column index of the first column in the viewport.
 * @property {number | null} endColumn The column index of the last column in the viewport.
 * @property {number} count Total number of columns.
 * @property {number | null} startPosition Position of the first fully column (in px).
 * @property {boolean} isVisibleInTrimmingContainer Determines if the viewport is visible in the trimming container.
 */
export interface ColumnsCalculationType {
  startColumn: number | null;
  endColumn: number | null;
  count: number;
  startPosition: number | null;
  isVisibleInTrimmingContainer: boolean;
  columnStartOffset: number;
  columnEndOffset: number;
}

/**
 * @typedef {object} RowsCalculationType
 * @property {number | null} startRow The row index of the first row in the viewport.
 * @property {number | null} endRow The row index of the last row in the viewport.
 * @property {number} count Total number of rows.
 * @property {number | null} startPosition Position of the first fully row (in px).
 * @property {boolean} isVisibleInTrimmingContainer Determines if the viewport is visible in the trimming container.
 */
export interface RowsCalculationType {
  startRow: number | null;
  endRow: number | null;
  count: number;
  startPosition: number | null;
  isVisibleInTrimmingContainer: boolean;
  rowStartOffset: number;
  rowEndOffset: number;
}

/**
 * Interface for calculation type objects that are used to calculate viewport ranges.
 */
export interface CalculationTypeLike {
  initialize(context: unknown): void;
  process(index: number, context: unknown): void;
  finalize(context: unknown): void;
}

/**
 * @class ViewportBaseCalculator
 */
export class ViewportBaseCalculator {
  /**
   * The calculation types to be performed.
   *
   * @type {Array}
   */
  calculationTypes: Array<[string, CalculationTypeLike]> = [];
  /**
   * The calculation results.
   *
   * @type {Map<string, ColumnsCalculationType | RowsCalculationType>}
   */
  calculationResults: Map<string, CalculationTypeLike> = new Map();

  /**
   * Creates a new ViewportBaseCalculator instance.
   *
   * @param {Array<[string, CalculationTypeLike]>} calculationTypes - The calculation types to be performed.
   */
  constructor(calculationTypes: Array<[string, CalculationTypeLike]>) {
    this.calculationTypes = calculationTypes;
  }

  /**
   * Initializes all calculators (triggers all calculators before calculating the rows/columns sizes).
   *
   * @param {*} context The context object (rows or columns viewport calculator).
   */
  _initialize(context: unknown): void {
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
  _process(index: number, context: unknown): void {
    this.calculationTypes.forEach(([, calculator]) => calculator.process(index, context));
  }

  /**
   * Finalizes all calculators (triggers all calculators after calculating the rows/columns sizes).
   *
   * @param {*} context The context object (rows or columns viewport calculator).
   */
  _finalize(context: unknown): void {
    this.calculationTypes.forEach(([, calculator]) => calculator.finalize(context));
  }

  /**
   * Gets the results for the given calculator.
   *
   * @param {string} calculatorId The id of the calculator.
   * @returns {ColumnsCalculationType | RowsCalculationType}
   */
  getResultsFor(calculatorId: string): CalculationTypeLike | undefined {
    return this.calculationResults.get(calculatorId);
  }
}
