import { isValidTime } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';
import type { CellProperties } from '../../settings';

export const VALIDATOR_TYPE: 'time' = 'time';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "time" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").';

/**
 * Validates a time value against the source data format.
 *
 * @param {unknown} value The value to validate.
 * @param {CellProperties} cellMeta The cell meta object.
 * @returns {boolean} True if valid.
 */
export function sourceDataValidator(value: unknown, cellMeta: CellProperties): boolean {
  if (cellMeta.allowEmpty && isEmpty(value)) {
    return true;
  }

  // Formula expressions are handled by the Formulas plugin — skip source-data validation for them.
  if (typeof value === 'string' && value.startsWith('=')) {
    return true;
  }

  return isValidTime(value);
}

// Marks the validator as row-independent: its result depends only on the value and column/global-level
// meta (`allowEmpty`), never on per-row meta. This lets the source-data validation runner reuse one
// column-level meta object across all rows instead of materializing a meta object per cell.
sourceDataValidator.rowIndependent = true;

/**
 * The Time cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function timeValidator(this: CellProperties, value: unknown, callback: (valid: boolean) => void): void {
  if (this.allowEmpty && isEmpty(value)) {
    callback(true);

    return;
  }

  callback(isValidTime(value));
}

timeValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
