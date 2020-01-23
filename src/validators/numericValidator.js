import { isNumeric } from './../helpers/number';

/**
 * The Numeric cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export default function numericValidator(value, callback) {
  let valueToValidate = value;

  if (valueToValidate === null || valueToValidate === void 0) {
    valueToValidate = '';
  }
  if (this.allowEmpty && valueToValidate === '') {
    callback(true);

  } else if (valueToValidate === '') {
    callback(false);

  } else {
    callback(isNumeric(value));
  }
}
