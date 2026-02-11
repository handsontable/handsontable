import { isValidTime } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';

export const VALIDATOR_TYPE = 'intl-time';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "intlTime" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").';

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

  return isValidTime(value);
}

/**
 * The IntlTime cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function intlTimeValidator(value, callback) {
  if (this.allowEmpty && isEmpty(value)) {
    callback(true);

    return;
  }

  callback(isValidTime(value));
}

intlTimeValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
