/**
 * Numeric cell validator
 * @param {*} value - Value of edited cell
 * @param {*} calback - Callback called with validation result
 */
Handsontable.NumericValidator = function (value, callback) {
  callback(/^-?\d*\.?\d*$/.test(value));
}