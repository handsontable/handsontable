import moment from 'moment';

const DEFAULT_DATE_FORMAT_HYPERFORMULA = 'DD/MM/YYYY';

/**
 * Checks if provided formula expression is escaped.
 *
 * @param {*} expression Expression to check.
 * @returns {boolean}
 */
export function isEscapedFormulaExpression(expression) {
  return typeof expression === 'string' && expression.charAt(0) === '\'' && expression.charAt(1) === '=';
}

/**
 * Replaces escaped formula expression into valid non-unescaped string.
 *
 * @param {string} expression Expression to process.
 * @returns {string}
 */
export function unescapeFormulaExpression(expression) {
  return isEscapedFormulaExpression(expression) ? expression.substr(1) : expression;
}

/**
 * Checks whether string looks like formula or not. Corresponds to {@link https://hyperformula.handsontable.com/api/globals.html#isformula|HyperFormula's implementation}.
 *
 * @param {string} value Checked value.
 * @returns {boolean}
 */
export function isFormula(value) {
  return typeof value === 'string' && value.startsWith('=');
}

/**
 * Checks if provided value is a date according to cell meta.
 *
 * @param {*} value Checked value.
 * @param {string} cellType Type of a cell.
 * @returns {boolean}
 */
export function isDate(value, cellType) {
  return typeof value === 'string' && cellType === 'date';
}

/**
 * Checks if provided date is a valid date according to cell date format.
 *
 * @param {*} date Checked date.
 * @param {object} dateFormat Handled format for a date.
 * @returns {boolean}
 */
export function isDateValid(date, dateFormat) {
  return moment(date, dateFormat, true).isValid();
}

/**
 * Returns date formatted in HF's default format.
 *
 * @param {string} date Date formatted according to Handsontable cell date format.
 * @param {string} dateFormat The format used for the date passed.
 * @returns {string}
 */
export function getDateInHfFormat(date, dateFormat) {
  return moment(date, dateFormat, true).format(DEFAULT_DATE_FORMAT_HYPERFORMULA);
}

/**
 * Returns date formatted in HF's default format.
 *
 * @param {string} date Date formatted according to Handsontable cell date format.
 * @param {string} dateFormat The format used for the date passed.
 * @returns {string}
 */
export function getDateInHotFormat(date, dateFormat) {
  return moment(date, DEFAULT_DATE_FORMAT_HYPERFORMULA, true).format(dateFormat);
}

/**
 * Converts Excel-like dates into strings and formats them based on the handled date format.
 *
 * @param {number} numericDate An integer representing numbers of days from January 1, 1900.
 * @param {string} dateFormat The format used for parsing an output.
 * @returns {string}
 */
export function getDateFromExcelDate(numericDate, dateFormat) {
  // To replicate the behavior from the HyperFormula. UTC starts from 31/12/1899, while HF from 30/12/1899.
  const dateOffset = -1;

  // Based on solution from: https://stackoverflow.com/a/67130235.
  const dateForFormatting = new Date(Date.UTC(0, 0, numericDate + dateOffset));

  return moment(dateForFormatting).format(dateFormat);
}
