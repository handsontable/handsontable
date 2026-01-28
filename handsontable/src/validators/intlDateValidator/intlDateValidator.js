import { isValidISODate } from '../../helpers/date';
import { isEmpty } from '../../helpers/mixed';

export const VALIDATOR_TYPE = 'intlDate';

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
