/**
 * Numeric cell validator
 * @param {*} value - Value of edited cell
 */
Handsontable.NumericValidator = function (value, callback) {
  callback(/^-?\d*\.?\d*$/.test(value));
}