/**
 * Numeric cell validator
 *
 * @private
 * @validator NumericValidator
 * @param {*} value - Value of edited cell
 * @param {*} callback - Callback called with validation result
 */
export default function numericValidator(value, callback) {
  if (value == null) {
    value = '';
  }
  if (this.allowEmpty && value === '') {
    callback(true);

  } else if (value === '') {
    callback(false);

  } else {
    callback(/^\s*[+-]?\s*(?:(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(?:0x[a-f\d]+))\s*$/i.test(value));
  }
};
