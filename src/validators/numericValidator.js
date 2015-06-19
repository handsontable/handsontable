/**
 * Numeric cell validator
 *
 * @private
 * @validator NumericValidator
 * @param {*} value - Value of edited cell
 * @param {*} callback - Callback called with validation result
 */
Handsontable.NumericValidator = function (value, callback) {
  if (value === null) {
    value = '';
  }
  callback(/^-?\d*(\.|\,)?\d*$/.test(value));
};
