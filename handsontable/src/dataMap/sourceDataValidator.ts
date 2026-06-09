import { logAggregatedItems, warn } from '../helpers/console';
import { isFunction } from '../helpers/function';
import { stringify } from '../helpers/mixed';

type CellMeta = Record<string, unknown> & {
  sourceDataValidator?: (value: unknown, cellMeta: CellMeta, source?: string) => boolean;
  sourceDataWarningMessage?: string;
  allowInvalid?: boolean;
  row?: number;
  col?: number;
};

/**
 * Runs source-data validator for a single cell.
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
 * Runs source-data validators for all cells and emits one aggregated warning per cell type.
 */
export function runSourceDataValidators(hotInstance: Record<string, unknown>, source?: string): void {
  const rowSourceCount = (hotInstance.countSourceRows as () => number)();
  const colSourceCount = (hotInstance.countSourceCols as () => number)();

  if (rowSourceCount === 0 || colSourceCount === 0) {
    return;
  }

  const invalidByMessageType = new Map<string, Array<{ row: number; col: number; value: unknown; message?: string }>>();

  for (let row = 0; row < rowSourceCount; row += 1) {
    for (let col = 0; col < colSourceCount; col += 1) {
      const visualRow = (hotInstance.toVisualRow as (r: number) => number | null)(row);
      const visualColumn = (hotInstance.toVisualColumn as (c: number) => number | null)(col);

      if (visualRow === null || visualColumn === null) {
        continue;
      }

      const cellMeta = (hotInstance.getCellMeta as (r: number, c: number) => CellMeta)(visualRow, visualColumn);
      const { sourceDataWarningMessage, sourceDataValidator, allowInvalid } = cellMeta;

      if (!isFunction(sourceDataValidator)) {
        continue;
      }

      type DataSource = {
        getAtCell: (r: number, c: number, v: null) => unknown;
        setAtCell: (r: number, c: number, v: null) => void;
      };
      const dataSource = (hotInstance._getDataSource as () => DataSource)();
      const value = dataSource.getAtCell(row, col, null);
      const isValid = sourceDataValidator(value, cellMeta, source);

      if (isValid === true) {
        continue;
      }

      if (allowInvalid === false) {
        dataSource.setAtCell(row, col, null);
      }

      if (sourceDataWarningMessage) {
        const message = sourceDataWarningMessage;
        const list = invalidByMessageType.get(message) ?? [];

        list.push({ row, col, value, message });
        invalidByMessageType.set(message, list);
      }
    }
  }

  invalidByMessageType.forEach((items, message) => {
    logSourceDataWarning(message, items);
  });
}

/**
 *
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
