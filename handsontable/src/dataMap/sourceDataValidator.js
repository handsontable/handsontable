import { logAggregatedItems, warn } from '../helpers/console';
import { isFunction } from '../helpers/function';
import { stringify } from '../helpers/mixed';

/**
 * Runs source-data validator for a single cell.
 *
 * @param {*} value The value of the cell.
 * @param {CellProperties} cellMeta The cell meta object.
 * @param {string} [source] The call source identifier.
 * @returns {boolean|string} True if valid, a message/false otherwise.
 */
export function runSourceDataValidator(value, cellMeta, source, logWarning = true) {
  const validator = cellMeta.sourceDataValidator;

  if (!isFunction(validator)) {
    return true;
  }

  const isValid = validator(value, cellMeta, source);

  if (isValid === true) {
    return true;
  }

  const {
    row,
    col,
    sourceDataWarningMessage,
  } = cellMeta;

  if (logWarning && !isValid && sourceDataWarningMessage) {
    logSourceDataWarning(sourceDataWarningMessage, [{ row, col, value }]);
  }

  return cellMeta.allowInvalid === true ? true : false;
}

/**
 * Runs source-data validators for all cells and emits one aggregated warning per cell type
 * message when invalid values are found, to avoid spamming the console.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {string} [source] The call source identifier.
 */
export function runSourceDataValidators(hotInstance, source) {
  const rowSourceCount = hotInstance.countSourceRows();
  const colSourceCount = hotInstance.countSourceCols();

  if (rowSourceCount === 0 || colSourceCount === 0) {
    return;
  }

  const invalidByMessageType = new Map();

  for (let row = 0; row < rowSourceCount; row += 1) {
    for (let col = 0; col < colSourceCount; col += 1) {
      const visualRow = hotInstance.toVisualRow(row);
      const visualColumn = hotInstance.toVisualColumn(col);

      if (visualRow === null || visualColumn === null) {
        continue;
      }

      const cellMeta = hotInstance.getCellMeta(visualRow, visualColumn);
      const {
        sourceDataWarningMessage,
      } = cellMeta;
      const dataSource = hotInstance._getDataSource();
      const value = dataSource.getAtCell(row, col, null);

      const validationResult = runSourceDataValidator(value, cellMeta, source, false);

      if (validationResult === true) {
        continue;
      }

      dataSource.setAtCell(row, col, null);

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
 * Logs a source data warning.
 *
 * @param {string} message The message to log.
 * @param {Array} items The list of affected cells.
 */
function logSourceDataWarning(message, items) {
  logAggregatedItems({
    logFunction: warn,
    message,
    items,
    itemFormatter: ({ row, col, value }) => {
      const rawValue = stringify(value);
      const shortValue = rawValue.length > 64 ? `${rawValue.slice(0, 64)}...` : rawValue;

      return `row ${row}, col ${col}, value: ${shortValue}`;
    },
  });
}
