import { isValidISODate } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';

export const VALIDATOR_TYPE = 'intlDate';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "intlDate" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").';

/**
 * Source data validator.
 *
 * @param {*} value Value of the source data of the cell.
 * @param {CellMeta} cellMeta Cell meta object.
 * @returns {boolean} True if valid, false otherwise.
 */
export function sourceDataValidator(value, cellMeta) {
  if (cellMeta.allowEmpty && isEmpty(value)) {
    return true;
  }

  return isValidISODate(value);
}

/**
 * The Date cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function intlDateValidator(value, callback) {
  if (this.allowEmpty && isEmpty(value)) {
    callback(true);

    return;
  }

  callback(isValidISODate(value));
}

intlDateValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
