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
 * Checks if provided value is valid date according to cell date format.
 *
 * @param {*} value Checked value.
 * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
 * @returns {boolean}
 */
export function isValidDate(value, cellProperties) {
  return typeof value === 'string' && cellProperties.type === 'date' &&
    moment(value, cellProperties.dateFormat, true).isValid();
}

/**
 * Returns date formatted in HF's default format.
 *
 * @param {string} date Date formatted according to Handsontable cell date format.
 * @param {string} format The format used for the date passed.
 * @returns {string}
 */
export function getDateInHfFormat(date, format) {
  return moment(date, format, true).format(DEFAULT_DATE_FORMAT_HYPERFORMULA);
}

/**
 * Converting from Excel like date to Date object.
 *
 * @param {number} numericDate Date being numbers of days from January 1, 1900.
 * @returns {Date}
 */
export function getDateFromExcelDate(numericDate) {
  let dateOffset = 0;

  // Excel incorrectly assumes that the year 1900 is a leap year.
  // Read more: https://learn.microsoft.com/en-us/office/troubleshoot/excel/wrongly-assumes-1900-is-leap-year.
  if (numericDate >= 60) {
    // We need to add some offset for dates after February 28, 1900.
    dateOffset = -1;
  }

  // Based on solution from: https://stackoverflow.com/a/67130235.
  return new Date(Date.UTC(0, 0, numericDate + dateOffset));
}
