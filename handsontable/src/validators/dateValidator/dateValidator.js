import { isValidDateObject, isValidTimestamp, isValidISODate } from '../../helpers/date';

export const VALIDATOR_TYPE = 'date';

/**
 * The Date cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function dateValidator(value, callback) {
  // Empty values are considered valid
  if (value === null || value === undefined || value === '') {
    callback(true);

    return;
  }

  if (value instanceof Date) {
    callback(isValidDateObject(value));

    return;
  }

  if (typeof value === 'number') {
    callback(isValidTimestamp(value));

    return;
  }


  if (typeof value === 'string' && isValidISODate(value)) {
    callback(true);

    return;
  }

  callback(false);
}

dateValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
