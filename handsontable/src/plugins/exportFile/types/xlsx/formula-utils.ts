/**
 * Maps ColumnSummary type names to their Excel function equivalents.
 *
 * `custom` is intentionally omitted: a `customFunction` is arbitrary JavaScript
 * and has no generic Excel formula equivalent.  When `exportFormulas` is `true`,
 * cells with a `custom` summary type fall back to their pre-calculated static value.
 */
const SUMMARY_TYPE_TO_EXCEL_FN: Record<string, string> = {
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
 * Examples: `'A'` → 1, `'Z'` → 26, `'AA'` → 27.
 *
 * @private
 * @param {string} letters Column letter string (uppercase).
 * @returns {number}
 */
export function colLetterToIndex(letters: string): number {
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
export function isFormulaValue(value: unknown): value is string {
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
export function buildSummaryFormula(
  summary: { type: string; sourceCol: number; sourceRanges: [number, number][] },
  dataRowOffset: number,
  dataColOffset: number
): { formula: string } | null {
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
export function replaceSeparatorOutsideStrings(str: string, from: string, to: string): string {
  let result = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (inString) {
      result += ch;

      if (ch === stringChar) {
        if (str[i + 1] === stringChar) {
          // Escaped quote (e.g. "" inside a double-quoted string) — consume
          // both characters and remain in string mode.
          result += str[i + 1];
          i += 1;
        } else {
          inString = false;
        }
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
 * Counts how many values in a `Set` are strictly less than `threshold`.
 *
 * @private
 * @param {Set<number>} set Set of numbers.
 * @param {number} threshold Upper bound (exclusive).
 * @returns {number}
 */
function countBelow(set: Set<number>, threshold: number): number {
  let count = 0;

  set.forEach((value) => {
    if (value < threshold) {
      count += 1;
    }
  });

  return count;
}

/**
 * Normalizes a HyperFormula formula string for use in an Excel OOXML file.
 *
 * Performs three transformations:
 * 1. Strips the leading `=` character.
 * 2. Translates A1-style cell references so that each reference points to the
 *    correct Excel cell after header rows/columns are prepended and any excluded
 *    hidden rows/columns are removed. The base offset (`rowOffset` / `colOffset`)
 *    accounts for the prepended headers; the optional `excludedHiddenRows` and
 *    `excludedHiddenCols` sets fine-tune per-reference when hidden items have been
 *    dropped from the exported data matrix.
 * 3. Replaces `separator` with `,` outside string literals (OOXML always uses `,`).
 *
 * @private
 * @param {string} formulaStr Raw formula string (starts with `=`).
 * @param {string} separator HyperFormula's `functionArgSeparator` (e.g. `','` or `';'`).
 * @param {number} rowOffset Base number to add to every row number in a cell reference.
 * @param {number} colOffset Base number to add to every column number in a cell reference.
 * @param {Set<number>} [excludedHiddenRows] Physical HOT row indices that are hidden and
 *   excluded from the exported data matrix. When provided, each row reference is further
 *   reduced by the number of excluded rows that precede it.
 * @param {Set<number>} [excludedHiddenCols] Physical HOT column indices that are hidden
 *   and excluded from the exported data matrix. When provided, each column reference is
 *   further reduced by the number of excluded columns that precede it.
 * @returns {string}
 */
export function normalizeFormula(
  formulaStr: string,
  separator: string,
  rowOffset: number,
  colOffset: number,
  excludedHiddenRows?: Set<number>,
  excludedHiddenCols?: Set<number>
): string {
  let formula = formulaStr.startsWith('=') ? formulaStr.slice(1) : formulaStr;
  const hasRowExclusions = (excludedHiddenRows?.size ?? 0) > 0;
  const hasColExclusions = (excludedHiddenCols?.size ?? 0) > 0;

  if (rowOffset !== 0 || colOffset !== 0 || hasRowExclusions || hasColExclusions) {
    // The leading alternative matches string literals (double-quoted Excel strings use "" to escape a quote;
    // single-quoted tokens are sheet name references like 'Sheet 1'!A1). When matched, they are returned
    // as-is so that cell-reference-like patterns inside string values are not offset.
    formula = formula.replace(
      /("(?:[^"]|"")*"|'[^']*')|(?<!\d)(\$?)([A-Z]{1,3})(\$?)(\d{1,7})(?!\()/g,
      (match, strLiteral, colAbs, colLetters, rowAbs, rowStr) => {
        if (strLiteral !== undefined) {
          return strLiteral;
        }

        const hotPhysCol = colLetterToIndex(colLetters) - 1; // 0-based physical HOT column
        const hotPhysRow = Number.parseInt(rowStr, 10) - 1; // 0-based physical HOT row

        const hiddenColsBefore = (hasColExclusions && excludedHiddenCols)
          ? countBelow(excludedHiddenCols, hotPhysCol) : 0;
        const hiddenRowsBefore = (hasRowExclusions && excludedHiddenRows)
          ? countBelow(excludedHiddenRows, hotPhysRow) : 0;

        const newCol = colLetterToIndex(colLetters) + colOffset - hiddenColsBefore;
        const newRow = Number.parseInt(rowStr, 10) + rowOffset - hiddenRowsBefore;

        return `${colAbs}${colIndexToLetter(newCol)}${rowAbs}${newRow}`;
      }
    );
  }

  if (separator && separator !== ',') {
    formula = replaceSeparatorOutsideStrings(formula, separator, ',');
  }

  return formula;
}
