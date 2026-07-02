import type { HotInstance } from '../core/types';
import type { GridSettings } from '../core/settings';
import type { default as DataSource } from './dataSource';
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
 * Inspects column-level meta (one uncached sample per column, O(cols)) to decide how source-data
 * validation should run. Meta is resolved through `getCellMetaUncached`, so the sample reflects the
 * global and column layers only — the `cells` function and the `before`/`afterGetCellMeta` hooks are
 * never run here (see `runSourceDataValidators`). Because column meta does not vary by row, the sample
 * is taken at physical row 0 regardless of trimming. Returns the columns whose validator is
 * row-independent (safe to validate by reusing one column meta), or signals a full per-cell scan when
 * any column carries a validator that may depend on per-row meta.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {number} colSourceCount The number of physical source columns.
 * @returns {object} `{ fullScan, columns }` — when `fullScan` is `true`, `columns` is empty.
 */
function collectColumnValidators(
  hotInstance: HotInstance,
  colSourceCount: number
): { fullScan: boolean; columns: ColumnValidator[] } {
  const metaManager = hotInstance._getMetaManager();
  const columns: ColumnValidator[] = [];

  for (let physicalColumn = 0; physicalColumn < colSourceCount; physicalColumn += 1) {
    const visualColumn = hotInstance.columnIndexMapper.getVisualFromPhysicalIndex(physicalColumn);

    if (visualColumn === null) {
      continue;
    }

    const cellMeta = metaManager
      .getCellMetaUncached<CellMeta>(0, physicalColumn, { visualRow: 0, visualColumn });
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
 * Validates every source cell by resolving meta per cell (O(rows*cols) meta). Used when a
 * row-dependent custom validator is configured, or when a cell carries persistent per-cell meta (the
 * `cell` option or `setCellMeta`) that a single column sample cannot represent. Meta is resolved with
 * `getCellMetaUncached`, so no per-cell meta object is retained (the scan does not grow the meta cache
 * to O(rows*cols)) and the `cells` function / `before`/`afterGetCellMeta` hooks are not run.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {DataSource} dataSource The data source.
 * @param {number} rowSourceCount The number of physical source rows.
 * @param {number} colSourceCount The number of physical source columns.
 * @param {Map} invalidByMessageType The accumulator of invalid entries keyed by warning message.
 * @param {string} [source] The source identifier of the operation.
 * @returns {void}
 */
function validatePerCell(
  hotInstance: HotInstance,
  dataSource: DataSource,
  rowSourceCount: number,
  colSourceCount: number,
  invalidByMessageType: InvalidItems,
  source?: string
): void {
  const { rowIndexMapper, columnIndexMapper } = hotInstance;
  const metaManager = hotInstance._getMetaManager();

  for (let row = 0; row < rowSourceCount; row += 1) {
    for (let col = 0; col < colSourceCount; col += 1) {
      const visualRow = rowIndexMapper.getVisualFromPhysicalIndex(row);
      const visualColumn = columnIndexMapper.getVisualFromPhysicalIndex(col);

      if (visualRow === null || visualColumn === null) {
        continue;
      }

      const cellMeta = metaManager
        .getCellMetaUncached<CellMeta>(row, col, { visualRow, visualColumn });

      if (!isFunction(cellMeta.sourceDataValidator)) {
        continue;
      }

      const value = dataSource.getAtCell(row, col);

      validateSourceCell(cellMeta, value, row, col, dataSource, invalidByMessageType, source);
    }
  }
}

/**
 * Validates source cells while reusing one column-level meta object per column instead of
 * materializing a meta object per cell (O(cols) meta instead of O(rows*cols)).
 *
 * Iterates row by row (column inner) so each physical row is translated to its visual index once and
 * the aggregated-warning order stays row-major (matching the per-cell scan).
 *
 * @param {Array} columns The columns whose (row-independent) validator should run.
 * @param {DataSource} dataSource The data source.
 * @param {number} rowSourceCount The number of physical source rows.
 * @param {Function} toVisualRow Translates a physical row index to its visual index (or `null`).
 * @param {Map} invalidByMessageType The accumulator of invalid entries keyed by warning message.
 * @param {string} [source] The source identifier of the operation.
 * @returns {void}
 */
function validateBatched(
  columns: ColumnValidator[],
  dataSource: DataSource,
  rowSourceCount: number,
  toVisualRow: (row: number) => number | null,
  invalidByMessageType: InvalidItems,
  source?: string
): void {
  for (let row = 0; row < rowSourceCount; row += 1) {
    // Skip rows that have no visual index (trimmed rows) to match the per-cell scan, which never
    // validates or blanks source values for rows that map to `null`.
    if (toVisualRow(row) === null) {
      continue;
    }

    for (let i = 0; i < columns.length; i += 1) {
      const { physicalColumn, cellMeta } = columns[i];
      const value = dataSource.getAtCell(row, physicalColumn);

      validateSourceCell(cellMeta, value, row, physicalColumn, dataSource, invalidByMessageType, source);
    }
  }
}

/**
 * Detects whether any cell carries persistent per-cell meta that a single column sample cannot
 * represent — the declarative `cell` option or imperatively-set cell meta (`setCellMeta`). These are
 * the only per-row sources that `getCellMetaUncached` resolves, so they force the per-cell scan. The
 * `cells` function and the `before`/`afterGetCellMeta` hooks are deliberately NOT considered here:
 * source-data validation resolves meta uncached and never runs them, so they cannot change which
 * cells carry a `sourceDataValidator`.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {GridSettings} settings The resolved grid settings.
 * @returns {boolean} `true` when meta must be resolved per cell.
 */
function hasStoredPerCellMeta(hotInstance: HotInstance, settings: GridSettings): boolean {
  return (Array.isArray(settings.cell) && settings.cell.length > 0) ||
    hotInstance._getMetaManager().getUserDefinedCellMetas().length > 0;
}

/**
 * Runs source-data validators for all cells and emits one aggregated warning per cell type.
 *
 * Meta is resolved with `getCellMetaUncached`, so validation considers the global and column layers,
 * the declarative `cell` option, and imperative `setCellMeta` overrides — but never a `cells` function
 * or the `before`/`afterGetCellMeta` hooks. A cheap O(cols) column probe decides the path:
 *
 * - No column exposes a `sourceDataValidator` and no cell carries persistent per-cell meta — there is
 *   nothing to validate, so the scan is skipped entirely. This is what keeps a large grid with a
 *   `cells` function (but no validators) from resolving meta for the whole dataset on every load.
 * - Only row-independent built-in validators (`date`/`time`/`intlDate`/`intlTime`) and no persistent
 *   per-cell meta — validation reuses one column-level meta per column (O(cols)).
 * - A row-dependent custom validator, or persistent per-cell meta (`cell`/`setCellMeta`) — validation
 *   resolves each cell uncached (O(rows*cols) work, but no retained per-cell meta objects).
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {string} [source] The source identifier of the operation.
 * @returns {void}
 */
export function runSourceDataValidators(hotInstance: HotInstance, source?: string): void {
  const rowSourceCount = hotInstance.countSourceRows();
  const colSourceCount = hotInstance.countSourceCols();

  if (rowSourceCount === 0 || colSourceCount === 0) {
    return;
  }

  const settings = hotInstance.getSettings();
  const dataSource = hotInstance._getDataSource();
  const invalidByMessageType: InvalidItems = new Map();
  const { fullScan, columns } = collectColumnValidators(hotInstance, colSourceCount);
  const hasStoredMeta = hasStoredPerCellMeta(hotInstance, settings);

  // Nothing carries (or could carry) a source-data validator — skip the scan entirely.
  if (!fullScan && columns.length === 0 && !hasStoredMeta) {
    return;
  }

  if (fullScan || hasStoredMeta) {
    validatePerCell(hotInstance, dataSource, rowSourceCount, colSourceCount, invalidByMessageType, source);
  } else {
    const toVisualRow = (row: number) => hotInstance.rowIndexMapper.getVisualFromPhysicalIndex(row);

    validateBatched(columns, dataSource, rowSourceCount, toVisualRow, invalidByMessageType, source);
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
