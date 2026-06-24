import { logAggregatedItems, warn } from '../helpers/console';
import { isFunction } from '../helpers/function';
import { stringify } from '../helpers/mixed';

type SourceDataValidatorFn = {
  (value: unknown, cellMeta: CellMeta, source?: string): boolean;

  /**
   * When `true`, the validator's result depends only on the value and column/global-level meta, never
   * on per-row meta — so a single column-level meta object can validate every row of the column.
   */
  rowIndependent?: boolean;
};

type CellMeta = Record<string, unknown> & {
  sourceDataValidator?: SourceDataValidatorFn;
  sourceDataWarningMessage?: string;
  allowInvalid?: boolean;
  row?: number;
  col?: number;
};

type DataSource = {
  getAtCell: (r: number, c: number, v: null) => unknown;
  setAtCell: (r: number, c: number, v: null) => void;
};

type InvalidItems = Map<string, Array<{ row: number; col: number; value: unknown; message?: string }>>;

type ColumnValidator = {
  physicalColumn: number;
  cellMeta: CellMeta;
};

/**
 * Runs source-data validator for a single cell.
 *
 * @param {unknown} value The value to validate.
 * @param {object} cellMeta The cell meta object.
 * @param {string} [source] The source identifier of the operation.
 * @returns {boolean} `true` when the value is valid (or no validator is configured).
 */
export function runSourceDataValidator(value: unknown, cellMeta: CellMeta, source?: string): boolean {
  const validator = cellMeta.sourceDataValidator;

  if (!isFunction(validator)) {
    return true;
  }

  const isValid = validator(value, cellMeta, source);

  if (isValid === true) {
    return true;
  }

  const { row, col, sourceDataWarningMessage, allowInvalid } = cellMeta;

  if (sourceDataWarningMessage) {
    logSourceDataWarning(sourceDataWarningMessage, [{ row, col, value }]);
  }

  return allowInvalid === true;
}

/**
 * Validates a single source cell against its (already resolved) cell meta, blanking the value when it
 * is invalid and `allowInvalid` is `false`, and collecting an aggregated-warning entry.
 *
 * @param {object} cellMeta The resolved cell meta (its `sourceDataValidator` must be a function).
 * @param {unknown} value The source value to validate.
 * @param {number} physicalRow The physical row index.
 * @param {number} physicalColumn The physical column index.
 * @param {object} dataSource The data source used to blank invalid values.
 * @param {Map} invalidByMessageType The accumulator of invalid entries keyed by warning message.
 * @param {string} [source] The source identifier of the operation.
 * @returns {void}
 */
function validateSourceCell(
  cellMeta: CellMeta,
  value: unknown,
  physicalRow: number,
  physicalColumn: number,
  dataSource: DataSource,
  invalidByMessageType: InvalidItems,
  source?: string
): void {
  const validator = cellMeta.sourceDataValidator;

  if (!isFunction(validator)) {
    return;
  }

  const isValid = validator(value, cellMeta, source);

  if (isValid === true) {
    return;
  }

  if (cellMeta.allowInvalid === false) {
    dataSource.setAtCell(physicalRow, physicalColumn, null);
  }

  const message = cellMeta.sourceDataWarningMessage;

  if (message) {
    const list = invalidByMessageType.get(message) ?? [];

    list.push({ row: physicalRow, col: physicalColumn, value, message });
    invalidByMessageType.set(message, list);
  }
}

/**
 * Inspects column-level meta (one sample cell per column, O(cols)) to decide how source-data
 * validation should run. Returns the columns whose validator is row-independent (safe to validate by
 * reusing one column meta), or signals a full per-cell scan when any column carries a validator that
 * may depend on per-row meta.
 *
 * @param {object} hotInstance The Handsontable instance.
 * @param {number} colSourceCount The number of physical source columns.
 * @returns {object} `{ fullScan, columns }` — when `fullScan` is `true`, `columns` is empty.
 */
function collectColumnValidators(
  hotInstance: Record<string, unknown>,
  colSourceCount: number
): { fullScan: boolean; columns: ColumnValidator[] } {
  const toVisualRow = hotInstance.toVisualRow as (row: number) => number | null;
  const toVisualColumn = hotInstance.toVisualColumn as (col: number) => number | null;
  const getCellMeta = hotInstance.getCellMeta as (row: number, col: number) => CellMeta;
  const sampleVisualRow = toVisualRow(0);

  if (sampleVisualRow === null) {
    return { fullScan: true, columns: [] };
  }

  const columns: ColumnValidator[] = [];

  for (let physicalColumn = 0; physicalColumn < colSourceCount; physicalColumn += 1) {
    const visualColumn = toVisualColumn(physicalColumn);

    if (visualColumn === null) {
      continue;
    }

    const cellMeta = getCellMeta(sampleVisualRow, visualColumn);
    const validator = cellMeta.sourceDataValidator;

    if (!isFunction(validator)) {
      continue;
    }

    // A validator that may read per-row meta cannot be batched with a single column meta — fall back
    // to the per-cell scan for the whole dataset to preserve exact behavior.
    if (validator.rowIndependent !== true) {
      return { fullScan: true, columns: [] };
    }

    columns.push({ physicalColumn, cellMeta });
  }

  return { fullScan: false, columns };
}

/**
 * Validates every source cell by resolving meta per cell (O(rows*cols) meta). Used when per-cell meta
 * can vary by row (a `cells` function, a `cell` array, or a row-dependent custom validator).
 *
 * @param {object} hotInstance The Handsontable instance.
 * @param {object} dataSource The data source.
 * @param {number} rowSourceCount The number of physical source rows.
 * @param {number} colSourceCount The number of physical source columns.
 * @param {Map} invalidByMessageType The accumulator of invalid entries keyed by warning message.
 * @param {string} [source] The source identifier of the operation.
 * @returns {void}
 */
function validatePerCell(
  hotInstance: Record<string, unknown>,
  dataSource: DataSource,
  rowSourceCount: number,
  colSourceCount: number,
  invalidByMessageType: InvalidItems,
  source?: string
): void {
  const toVisualRow = hotInstance.toVisualRow as (row: number) => number | null;
  const toVisualColumn = hotInstance.toVisualColumn as (col: number) => number | null;
  const getCellMeta = hotInstance.getCellMeta as (row: number, col: number) => CellMeta;

  for (let row = 0; row < rowSourceCount; row += 1) {
    for (let col = 0; col < colSourceCount; col += 1) {
      const visualRow = toVisualRow(row);
      const visualColumn = toVisualColumn(col);

      if (visualRow === null || visualColumn === null) {
        continue;
      }

      const cellMeta = getCellMeta(visualRow, visualColumn);

      if (!isFunction(cellMeta.sourceDataValidator)) {
        continue;
      }

      const value = dataSource.getAtCell(row, col, null);

      validateSourceCell(cellMeta, value, row, col, dataSource, invalidByMessageType, source);
    }
  }
}

/**
 * Validates source cells column by column, reusing one column-level meta object per column instead of
 * materializing a meta object per cell (O(cols) meta instead of O(rows*cols)).
 *
 * @param {Array} columns The columns whose (row-independent) validator should run.
 * @param {object} dataSource The data source.
 * @param {number} rowSourceCount The number of physical source rows.
 * @param {Function} toVisualRow Translates a physical row index to its visual index (or `null`).
 * @param {Map} invalidByMessageType The accumulator of invalid entries keyed by warning message.
 * @param {string} [source] The source identifier of the operation.
 * @returns {void}
 */
function validateByColumn(
  columns: ColumnValidator[],
  dataSource: DataSource,
  rowSourceCount: number,
  toVisualRow: (row: number) => number | null,
  invalidByMessageType: InvalidItems,
  source?: string
): void {
  for (let i = 0; i < columns.length; i += 1) {
    const { physicalColumn, cellMeta } = columns[i];

    for (let row = 0; row < rowSourceCount; row += 1) {
      // Skip rows that have no visual index (trimmed rows) to match the per-cell scan, which never
      // validates or blanks source values for rows that map to `null`.
      if (toVisualRow(row) === null) {
        continue;
      }

      const value = dataSource.getAtCell(row, physicalColumn, null);

      validateSourceCell(cellMeta, value, row, physicalColumn, dataSource, invalidByMessageType, source);
    }
  }
}

/**
 * Runs source-data validators for all cells and emits one aggregated warning per cell type.
 *
 * For the common case (no `cells` function, no `cell` array, and only row-independent built-in source
 * validators such as `date`/`time`), validation reuses one column-level meta per column — avoiding the
 * O(rows*cols) cell-meta materialization that otherwise retains a meta object for every cell at load.
 *
 * @param {object} hotInstance The Handsontable instance.
 * @param {string} [source] The source identifier of the operation.
 * @returns {void}
 */
export function runSourceDataValidators(hotInstance: Record<string, unknown>, source?: string): void {
  const rowSourceCount = (hotInstance.countSourceRows as () => number)();
  const colSourceCount = (hotInstance.countSourceCols as () => number)();

  if (rowSourceCount === 0 || colSourceCount === 0) {
    return;
  }

  const settings = (hotInstance.getSettings as () => Record<string, unknown>)();
  const dataSource = (hotInstance._getDataSource as () => DataSource)();
  const invalidByMessageType: InvalidItems = new Map();

  // Per-cell meta can vary by row only through a `cells` function or an explicit `cell` array; in those
  // cases meta must be resolved per cell. Otherwise the per-column capture decides between the batched
  // path (row-independent validators) and a full scan (a row-dependent custom validator is present).
  const perCellMetaVaries = isFunction(settings.cells) ||
    (Array.isArray(settings.cell) && settings.cell.length > 0);

  if (perCellMetaVaries) {
    validatePerCell(hotInstance, dataSource, rowSourceCount, colSourceCount, invalidByMessageType, source);
  } else {
    const { fullScan, columns } = collectColumnValidators(hotInstance, colSourceCount);

    if (fullScan) {
      validatePerCell(hotInstance, dataSource, rowSourceCount, colSourceCount, invalidByMessageType, source);
    } else {
      const toVisualRow = hotInstance.toVisualRow as (row: number) => number | null;

      validateByColumn(columns, dataSource, rowSourceCount, toVisualRow, invalidByMessageType, source);
    }
  }

  invalidByMessageType.forEach((items, message) => {
    logSourceDataWarning(message, items);
  });
}

/**
 * Emits one aggregated console warning for a group of invalid source-data cells.
 *
 * @param {string} message The warning message template.
 * @param {Array} items The invalid cell entries to report.
 * @returns {void}
 */
function logSourceDataWarning(message: string, items: Array<{ row?: number; col?: number; value?: unknown }>): void {
  logAggregatedItems({
    logFunction: warn,
    message,
    items,
    itemFormatter: (item: unknown) => {
      const { row, col, value } = item as { row?: number; col?: number; value?: unknown };
      const rawValue = stringify(value);
      const shortValue = rawValue.length > 64 ? `${rawValue.slice(0, 64)}...` : rawValue;

      return `row ${row}, col ${col}, value: "${shortValue}"`;
    },
  });
}
