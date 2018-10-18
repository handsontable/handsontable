/**
 * Numeric cell validator
 *
 * @private
 * @validator NumericValidator
 * @param {*} value - Value of edited cell
 * @param {*} callback - Callback called with validation result
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
    callback(/^-?\d*(\.|,)?\d*$/.test(valueToValidate));
  }
}
