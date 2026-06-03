/**
 * @typedef ColumnsCalculationType
 * @property startColumn The column index of the first column in the viewport.
 * @property endColumn The column index of the last column in the viewport.
 * @property count Total number of columns.
 * @property startPosition Position of the first fully column (in px).
 * @property isVisibleInTrimmingContainer Determines if the viewport is visible in the trimming container.
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
 * @typedef RowsCalculationType
 * @property startRow The row index of the first row in the viewport.
 * @property endRow The row index of the last row in the viewport.
 * @property count Total number of rows.
 * @property startPosition Position of the first fully row (in px).
 * @property isVisibleInTrimmingContainer Determines if the viewport is visible in the trimming container.
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
   */
  calculationTypes: Array<[string, CalculationTypeLike]> = [];
  /**
   * The calculation results.
   *
   */
  calculationResults: Map<string, CalculationTypeLike> = new Map();

  /**
   * Stores the provided calculation types so they are available to the `_initialize` and `getResultsFor` methods.
   */
  constructor(calculationTypes: Array<[string, CalculationTypeLike]>) {
    this.calculationTypes = calculationTypes;
  }

  /**
   * Initializes all calculators (triggers all calculators before calculating the rows/columns sizes).
   *
   * @param context The context object (rows or columns viewport calculator).
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
   * @param index The index of the row/column.
   * @param context The context object (rows or columns viewport calculator).
   */
  _process(index: number, context: unknown): void {
    this.calculationTypes.forEach(([, calculator]) => calculator.process(index, context));
  }

  /**
   * Finalizes all calculators (triggers all calculators after calculating the rows/columns sizes).
   *
   * @param context The context object (rows or columns viewport calculator).
   */
  _finalize(context: unknown): void {
    this.calculationTypes.forEach(([, calculator]) => calculator.finalize(context));
  }

  /**
   * Gets the results for the given calculator.
   *
   * @param calculatorId The id of the calculator.
   * @returns 
   */
  getResultsFor(calculatorId: string): CalculationTypeLike | undefined {
    return this.calculationResults.get(calculatorId);
  }
}
