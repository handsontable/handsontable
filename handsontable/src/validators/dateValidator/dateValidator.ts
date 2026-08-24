import { isValidISODate } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';

export const VALIDATOR_TYPE: 'date' = 'date';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "date" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").';

type CellMeta = Record<string, unknown> & { allowEmpty?: boolean };

/**
 * Validates a date value against the source data format (ISO 8601).
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

  return isValidISODate(value);
}

// Marks the validator as row-independent: its result depends only on the value and column/global-level
// meta (`allowEmpty`), never on per-row meta. This lets the source-data validation runner reuse one
// column-level meta object across all rows instead of materializing a meta object per cell.
sourceDataValidator.rowIndependent = true;

/**
 * The Date cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function dateValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void): void {
  if (this.allowEmpty && isEmpty(value)) {
    callback(true);

    return;
  }

  callback(isValidISODate(value));
}

dateValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
