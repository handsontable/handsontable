import { isValidISODateTime } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';

export const VALIDATOR_TYPE: 'datetime' = 'datetime';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "datetime" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the ISO 8601 date-time format ("YYYY-MM-DDTHH:mm:ss").';

type CellMeta = Record<string, unknown> & { allowEmpty?: boolean };

/**
 * Validates a date-time value against the source data format.
 *
 * @param {unknown} value The value to validate.
 * @param {CellMeta} cellMeta The cell meta object.
 * @returns {boolean} True if valid.
 */
export function sourceDataValidator(value: unknown, cellMeta: CellMeta): boolean {
  if (cellMeta.allowEmpty && isEmpty(value)) {
    return true;
  }

  // Formula expressions are handled by the Formulas plugin — skip source-data validation for them.
  if (typeof value === 'string' && value.startsWith('=')) {
    return true;
  }

  return isValidISODateTime(value);
}

// Marks the validator as row-independent: its result depends only on the value and column/global-level
// meta (`allowEmpty`), never on per-row meta.
sourceDataValidator.rowIndependent = true;

/**
 * The DateTime cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function datetimeValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void): void {
  if (this.allowEmpty && isEmpty(value)) {
    callback(true);

    return;
  }

  callback(isValidISODateTime(value));
}

datetimeValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
