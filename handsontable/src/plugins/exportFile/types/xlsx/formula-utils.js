/**
 * Maps ColumnSummary type names to their Excel function equivalents.
 */
const SUMMARY_TYPE_TO_EXCEL_FN = {
  sum: 'SUM',
  min: 'MIN',
  max: 'MAX',
  count: 'COUNT',
  average: 'AVERAGE',
};

/**
 * Converts a 1-based column index to an Excel column letter string.
 *
 * Examples: 1 → `'A'`, 26 → `'Z'`, 27 → `'AA'`, 28 → `'AB'`.
 *
 * @private
 * @param {number} colIndex 1-based column index.
 * @returns {string}
 */
export function colIndexToLetter(colIndex) {
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
 * Examples: `'A'` → 1, `'Z'` → 26, `'AA'` → 27.
 *
 * @private
 * @param {string} letters Column letter string (uppercase).
 * @returns {number}
 */
export function colLetterToIndex(letters) {
  let index = 0;

  for (let i = 0; i < letters.length; i++) {
    index = (index * 26) + (letters.charCodeAt(i) - 64);
  }

  return index;
}

/**
 * Returns `true` when `value` is a string that starts with `=` (a formula).
 *
 * @private
 * @param {*} value Source data cell value.
 * @returns {boolean}
 */
export function isFormulaValue(value) {
  return typeof value === 'string' && value.startsWith('=');
}

/**
 * Builds an ExcelJS formula value object for a ColumnSummary destination cell.
 *
 * Maps Handsontable summary types to their Excel equivalents:
 * `sum` → `SUM`, `min` → `MIN`, `max` → `MAX`, `count` → `COUNT`,
 * `average` → `AVERAGE`. Returns `null` for `custom` and any unrecognized
 * type so the caller can fall back to the pre-calculated static value.
 *
 * @private
 * @param {object} summary Summary descriptor from {@link DataProvider#getColumnSummaries}.
 * @param {number} dataRowOffset 1-based Excel row where data row 0 starts.
 * @param {number} dataColOffset 1-based Excel column where data column 0 starts.
 * @returns {{ formula: string }|null}
 */
export function buildSummaryFormula(summary, dataRowOffset, dataColOffset) {
  const excelFn = SUMMARY_TYPE_TO_EXCEL_FN[summary.type];

  if (!excelFn) {
    return null;
  }

  const colLetter = colIndexToLetter(summary.sourceCol + dataColOffset);
  const rangeRefs = summary.sourceRanges.map(([start, end]) => {
    const startExcelRow = start + dataRowOffset;
    const endExcelRow = end + dataRowOffset;

    return startExcelRow === endExcelRow
      ? `${colLetter}${startExcelRow}`
      : `${colLetter}${startExcelRow}:${colLetter}${endExcelRow}`;
  });

  return { formula: `${excelFn}(${rangeRefs.join(',')})` };
}

/**
 * Replaces all occurrences of `from` with `to` in `str`, skipping characters
 * inside single-quoted or double-quoted string literals.
 *
 * @private
 * @param {string} str Input string.
 * @param {string} from Substring to replace.
 * @param {string} to Replacement substring.
 * @returns {string}
 */
export function replaceSeparatorOutsideStrings(str, from, to) {
  let result = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (inString) {
      result += ch;

      if (ch === stringChar) {
        inString = false;
      }
    } else if (ch === '"' || ch === '\'') {
      inString = true;
      stringChar = ch;
      result += ch;
    } else if (str.startsWith(from, i)) {
      result += to;
      i += from.length - 1;
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * Normalizes a HyperFormula formula string for use in an Excel OOXML file.
 *
 * Performs three transformations:
 * 1. Strips the leading `=` character.
 * 2. Translates A1-style cell references by adding `rowOffset` to row numbers and
 *    `colOffset` to column indices (so references point to the correct Excel cell
 *    after header rows/columns are prepended).
 * 3. Replaces `separator` with `,` outside string literals (OOXML always uses `,`).
 *
 * @private
 * @param {string} formulaStr Raw formula string (starts with `=`).
 * @param {string} separator HyperFormula's `functionArgSeparator` (e.g. `','` or `';'`).
 * @param {number} rowOffset Number to add to every row number in a cell reference.
 * @param {number} colOffset Number to add to every column number in a cell reference.
 * @returns {string}
 */
export function normalizeFormula(formulaStr, separator, rowOffset, colOffset) {
  let formula = formulaStr.startsWith('=') ? formulaStr.slice(1) : formulaStr;

  if (rowOffset !== 0 || colOffset !== 0) {
    formula = formula.replace(/([A-Z]+)(\d+)(?!\()/g, (match, colLetters, rowStr) => {
      const newCol = colLetterToIndex(colLetters) + colOffset;
      const newRow = parseInt(rowStr, 10) + rowOffset;

      return `${colIndexToLetter(newCol)}${newRow}`;
    });
  }

  if (separator && separator !== ',') {
    formula = replaceSeparatorOutsideStrings(formula, separator, ',');
  }

  return formula;
}
