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
 * A formula reference token with a stable color index for editor and grid highlighting.
 */
export type FormulaReferenceToken = {
  start: number;
  end: number;
  colorIndex: number;
};

/**
 * Parsed A1-style cell, column, row, or range reference (0-based HyperFormula indexes).
 * `toRow`/`toCol` may be `Infinity` for whole-column or whole-row references.
 */
export type ParsedCellReference = {
  sheetName: string | null;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
};

/**
 * Converts a 1-based column index to an Excel column letter string.
 *
 * @param {number} colIndex 1-based column index.
 * @returns {string}
 */
export function colIndexToLetter(colIndex: number): string {
  let letter = '';
  let n = colIndex;

  while (n > 0) {
    const remainder = (n - 1) % 26;

    letter = String.fromCharCode(65 + remainder) + letter;
    n = Math.floor((n - 1) / 26);
  }

  return letter;
}

/**
 * Converts an Excel column letter string to a 1-based column index.
 *
 * @param {string} letters Column letter string.
 * @returns {number}
 */
export function colLetterToIndex(letters: string): number {
  let index = 0;
  const upperLetters = letters.toUpperCase();

  for (let i = 0; i < upperLetters.length; i++) {
    index = (index * 26) + (upperLetters.charCodeAt(i) - 64);
  }

  return index;
}

/**
 * Parses an A1-style cell, column, row, or range reference token into 0-based HyperFormula indexes.
 *
 * @param {string} text Reference token text.
 * @returns {ParsedCellReference|null}
 */
export function parseCellReferenceToken(text: string): ParsedCellReference | null {
  const sheetPrefixMatch = text.match(/^(?:(?:'([^']+)'|(\w+))!)?/i);
  const sheetName = sheetPrefixMatch?.[1] ?? sheetPrefixMatch?.[2] ?? null;
  const addressPart = sheetPrefixMatch?.[0] ? text.slice(sheetPrefixMatch[0].length) : text;
  const columnMatch = addressPart.match(/^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})$/i);

  if (columnMatch !== null) {
    const fromCol = colLetterToIndex(columnMatch[2]) - 1;
    const toCol = colLetterToIndex(columnMatch[4]) - 1;

    return {
      sheetName,
      fromRow: 0,
      fromCol: Math.min(fromCol, toCol),
      toRow: Number.POSITIVE_INFINITY,
      toCol: Math.max(fromCol, toCol),
    };
  }

  const rowMatch = addressPart.match(/^(\$?)(\d{1,7}):(\$?)(\d{1,7})$/i);

  if (rowMatch !== null) {
    const fromRow = Number.parseInt(rowMatch[2], 10) - 1;
    const toRow = Number.parseInt(rowMatch[4], 10) - 1;

    return {
      sheetName,
      fromRow: Math.min(fromRow, toRow),
      fromCol: 0,
      toRow: Math.max(fromRow, toRow),
      toCol: Number.POSITIVE_INFINITY,
    };
  }

  const [startCorner, endCorner = startCorner] = addressPart.split(':');
  const fromCorner = parseCellReferenceCorner(startCorner);
  const toCorner = parseCellReferenceCorner(endCorner);

  if (fromCorner === null || toCorner === null) {
    return null;
  }

  return {
    sheetName,
    fromRow: Math.min(fromCorner.row, toCorner.row),
    fromCol: Math.min(fromCorner.col, toCorner.col),
    toRow: Math.max(fromCorner.row, toCorner.row),
    toCol: Math.max(fromCorner.col, toCorner.col),
  };
}

/**
 * Parses a single A1-style cell corner into 0-based HyperFormula indexes.
 *
 * @param {string} corner Single cell address without a sheet prefix.
 * @returns {{ row: number; col: number }|null}
 */
function parseCellReferenceCorner(corner: string): { row: number; col: number } | null {
  const match = corner.match(/^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})$/i);

  if (match === null) {
    return null;
  }

  return {
    col: colLetterToIndex(match[2]) - 1,
    row: Number.parseInt(match[4], 10) - 1,
  };
}

/**
 * Extracts all A1-style cell, column, row, and range references from a formula.
 *
 * @param {string} formula Formula string.
 * @returns {FormulaReferenceToken[]} Character ranges of each reference occurrence with stable color indexes.
 */
export function referencesFromFormula(formula: string): FormulaReferenceToken[] {
  const stringLiteralRanges: Array<{ start: number; end: number }> = [];

  for (const match of formula.matchAll(/"[^"\\]*(?:\\.[^"\\]*)*"/g)) {
    stringLiteralRanges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  const colorMap = new Map<string, number>();
  let nextColorIndex = 0;
  const ranges: FormulaReferenceToken[] = [];

  // eslint-disable-next-line max-len
  for (const match of formula.matchAll(/(?:(?:'[^']+'|\w+)!)?(?:\$?[A-Za-z]{1,3}\$?[0-9]{1,7}(?::\$?[A-Za-z]{1,3}\$?[0-9]{1,7})?|\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}|\$?[0-9]{1,7}:\$?[0-9]{1,7})/g)) {
    const start = match.index;
    const text = match[0];
    const upperText = text.toUpperCase();

    if (stringLiteralRanges.some(({ start: literalStart, end }) => start >= literalStart && start < end)) {
      continue;
    }

    if (!colorMap.has(text)) {
      colorMap.set(text, (nextColorIndex % 10) + 1);
      nextColorIndex += 1;
    }

    ranges.push({
      start,
      end: start + text.length,
      colorIndex: colorMap.get(text) ?? 1,
    });
  }

  return ranges;
}
