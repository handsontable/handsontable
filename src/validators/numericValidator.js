/**
 * Numeric cell validator
 * @param {*} value - Value of edited cell
 */
Handsontable.NumericValidator = function (value) {
  return /^-?\d*\.?\d*$/.test(value);
}