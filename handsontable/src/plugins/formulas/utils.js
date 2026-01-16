import { toDateObject, isValidDateObject } from '../../helpers/date';

const DEFAULT_DATE_FORMAT_HYPERFORMULA = 'DD/MM/YYYY';

/**
 * Formats a Date object according to the given format pattern.
 *
 * @param {Date} date The Date object to format.
 * @param {string} format The format pattern (e.g., 'DD/MM/YYYY').
 * @returns {string} Formatted date string.
 */
function formatDate(date, format) {
  const pad = (n) => String(n).padStart(2, '0');

  return format
    .replace('YYYY', date.getFullYear())
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('M', date.getMonth() + 1)
    .replace('D', date.getDate());
}

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
 * Checks if provided date is a valid date.
 *
 * @param {Date|number|string} date Date object, timestamp, or ISO string.
 * @returns {boolean}
 */
export function isDateValid(date) {
  return isValidDateObject(toDateObject(date));
}

/**
 * Returns date formatted in HF's default format (DD/MM/YYYY).
 *
 * @param {Date|number|string} date Date object, timestamp, or ISO string.
 * @returns {string}
 */
export function getDateInHfFormat(date) {
  const parsed = toDateObject(date);

  return parsed ? formatDate(parsed, DEFAULT_DATE_FORMAT_HYPERFORMULA) : '';
}

/**
 * Returns date formatted in the specified format.
 *
 * @param {Date|number|string} date Date object, timestamp, or ISO string.
 * @param {string} dateFormat The format to output (e.g., 'DD/MM/YYYY').
 * @returns {string}
 */
export function getDateInHotFormat(date, dateFormat) {
  const parsed = toDateObject(date);

  return parsed ? formatDate(parsed, dateFormat) : '';
}

/**
 * Converts Excel-like dates into strings and formats them based on the handled date format.
 *
 * @param {number} numericDate An integer representing numbers of days from January 1, 1900.
 * @param {string} dateFormat The format used for output (e.g., 'DD/MM/YYYY').
 * @returns {string}
 */
export function getDateFromExcelDate(numericDate, dateFormat) {
  // HyperFormula uses 30/12/1899 as epoch (Excel's 1900 date system with leap year bug)
  const date = new Date(1899, 11, 30 + numericDate);

  return formatDate(date, dateFormat);
}
