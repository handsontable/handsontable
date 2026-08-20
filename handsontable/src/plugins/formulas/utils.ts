import { isValidISODate } from '../../helpers/dateTime';
import { valueGetter as multiSelectValueGetter } from '../../cellTypes/multiSelectType/accessors/valueGetter';

/**
 * Checks if provided formula expression is escaped.
 *
 * @param {*} expression Expression to check.
 * @returns {boolean}
 */
export function isEscapedFormulaExpression(expression: unknown) {
  return typeof expression === 'string' && expression.charAt(0) === '\'' && expression.charAt(1) === '=';
}

/**
 * Replaces escaped formula expression into valid non-unescaped string.
 *
 * @param {string} expression Expression to process.
 * @returns {string}
 */
export function unescapeFormulaExpression(expression: unknown) {
  return typeof expression === 'string' && isEscapedFormulaExpression(expression) ? expression.substr(1) : expression;
}

/**
 * Checks whether string looks like formula or not. Corresponds to {@link https://hyperformula.handsontable.com/api/globals.html#isformula|HyperFormula's implementation}.
 *
 * @param {string} value Checked value.
 * @returns {boolean}
 */
export function isFormula(value: unknown) {
  return typeof value === 'string' && value.startsWith('=');
}

/**
 * Checks if provided value is a date according to cell meta.
 *
 * @param {*} value Checked value.
 * @param {string} cellType Type of a cell.
 * @returns {boolean}
 */
export function isDate(value: unknown, cellType: unknown): value is string {
  return typeof value === 'string' && cellType === 'date';
}

/**
 * Checks if provided date is a valid ISO 8601 date string.
 *
 * @param {*} date Checked date.
 * @returns {boolean}
 */
export function isDateValid(date: string): boolean {
  return isValidISODate(date);
}

/**
 * Returns date formatted for HyperFormula (ISO 8601 passthrough).
 *
 * @param {string} date Date string in ISO 8601 format.
 * @returns {string}
 */
export function getDateInHfFormat(date: string): string {
  return date;
}

/**
 * Returns date formatted for Handsontable (ISO 8601 passthrough).
 *
 * @param {string} date Date string in ISO 8601 format.
 * @returns {string}
 */
export function getDateInHotFormat(date: string): string {
  return date;
}

/**
 * Converts an HF day-fraction representation of a time value into a string formatted as HH:mm:ss.
 * HyperFormula represents date-time values as a single number, where the integer part
 * encodes the date (days since the HF epoch) and the fractional part encodes the time. This helper
 * ignores the integer part and formats the fractional part as a time string.
 *
 * @param {number} numericTime A number whose fractional part represents the time as a fraction of a day.
 * @returns {string}
 */
export function getTimeFromHfTimeFraction(numericTime: number): string {
  const SECONDS_IN_DAY = 86400;
  const dayFraction = numericTime - Math.floor(numericTime);
  const totalSeconds = Math.round(dayFraction * SECONDS_IN_DAY);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hhmm = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return seconds > 0 ? `${hhmm}:${String(seconds).padStart(2, '0')}` : hhmm;
}

/**
 * Converts Excel-like dates into ISO 8601 date strings.
 *
 * @param {unknown} numericDate An integer representing numbers of days from the HF epoch (1899-12-30).
 * @returns {string}
 */
export function getDateFromExcelDate(numericDate: unknown): string {
  // HF epoch is 1899-12-30 (UTC).
  const epochMs = Date.UTC(1899, 11, 30);
  const dateMs = epochMs + ((numericDate as number) * 86400000);
  const d = new Date(dateMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Coalesces a list of indexes into an ascending list of contiguous `[startIndex, amount]` spans.
 * For example, `[5, 1, 2, 3, 9]` becomes `[[1, 3], [5, 1], [9, 1]]`. The input order does not
 * matter and duplicate indexes are counted once.
 *
 * @param {number[]} indexes List of indexes to coalesce.
 * @returns {Array<Array<number>>} Ascending list of `[startIndex, amount]` spans.
 */
export function coalesceIndexesToSpans(indexes: number[]): [number, number][] {
  const sortedIndexes = [...indexes].sort((a, b) => a - b);
  const spans: [number, number][] = [];

  sortedIndexes.forEach((index) => {
    const lastSpan = spans[spans.length - 1];

    if (lastSpan === undefined || index > lastSpan[0] + lastSpan[1]) {
      spans.push([index, 1]);

    } else if (index === lastSpan[0] + lastSpan[1]) {
      lastSpan[1] += 1;
    }
  });

  return spans;
}

/**
 * Converts a Handsontable cell value to a value accepted by HyperFormula.
 * HyperFormula doesn't accept arrays as direct cell values, so they are converted to a
 * comma-separated string.
 *
 * @param {*} value Value to normalize.
 * @returns {*} Value normalized for HyperFormula.
 */
export function normalizeValueForFormulaEngine(value: unknown) {
  if (Array.isArray(value)) {
    return multiSelectValueGetter(value);
  }

  return value;
}

/**
 * Checks if the provided value is a text-cell value that should be preserved — passed to the
 * engine as a string, protected from being coerced to a number — according to the cell meta
 * (`type: 'text'` combined with `preserveTextValues: true`). Formulas are never preserved. Empty
 * strings are never preserved either, so clearing a cell keeps producing an empty cell in the engine.
 *
 * @param {*} value Checked value.
 * @param {object} cellMeta Cell meta object with the `type` and `preserveTextValues` properties.
 * @returns {boolean}
 */
export function isPreservedText(
  value: unknown,
  cellMeta: { type?: string, preserveTextValues?: boolean },
): value is string {
  return typeof value === 'string' &&
    value !== '' &&
    cellMeta.type === 'text' &&
    cellMeta.preserveTextValues === true &&
    !isFormula(value);
}

/**
 * Escapes the value from the engine's value parsing using the "'" sign (HyperFormula feature).
 *
 * @param {string} value Value to escape.
 * @returns {string}
 */
export function escapeTextValue(value: string): string {
  return `'${value}`;
}
