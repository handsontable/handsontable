import { colIndexToLetter, colLetterToIndex } from '../../../../utils/xlsxEngine/cellRef';
import { mapFormulaReferences, type ReferenceMap } from '../../../../utils/xlsxEngine/formulaRefs';
import { isNameChar, skipQuoted } from '../../../../utils/xlsxEngine/functionPrefixes';
import { ILLEGAL_XML_CHAR } from '../../../../utils/xlsxEngine/adapters/native/xml/escapes';
import { stripArrayFormulaCalls } from '../../../../utils/xlsxEngine/dynamicArrays';

/**
 * The column-letter converters, re-exported from the shared xlsx engine layer so the export's own
 * formula helpers stay one import for callers: `colIndexToLetter` turns a 1-based column index into
 * an Excel column letter string (1 → `'A'`, 27 → `'AA'`), `colLetterToIndex` inverts it.
 */
export { colIndexToLetter, colLetterToIndex };

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
 * Builds a formula value object, in an ExcelJS-compatible shape, for a ColumnSummary destination
 * cell.
 *
 * Maps Handsontable summary types to their Excel equivalents:
 * `sum` → `SUM`, `min` → `MIN`, `max` → `MAX`, `count` → `COUNT`,
 * `average` → `AVERAGE`. Returns `null` for `custom` and any unrecognized
 * type so the caller can fall back to the pre-calculated static value.
 *
 * @private
 * @param {object} summary Summary descriptor from {@link ExportDataProvider#getColumnSummaries}.
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
 * inside single-quoted or double-quoted string literals and inside an array literal
 * (`{1,2;3,4}`): its `;` separates rows in OOXML as it does in HyperFormula, so swapping a `;`
 * argument separator there turned `INDEX({1,2;3,4};2;1)` into `INDEX({1,2,3,4},2,1)`.
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
  let arrayDepth = 0;

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
    } else if (ch === '{' || (ch === '}' && arrayDepth > 0)) {
      arrayDepth += ch === '{' ? 1 : -1;
      result += ch;
    } else if (arrayDepth === 0 && str.startsWith(from, i)) {
      result += to;
      i += from.length - 1;
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * Whether a character is an ASCII digit.
 *
 * @param {string|undefined} char The character.
 * @returns {boolean}
 */
function isDigit(char: string | undefined): boolean {
  return char !== undefined && char >= '0' && char <= '9';
}

/**
 * Writes the decimal separator of HyperFormula's number literals as the `.` OOXML always uses.
 *
 * A number literal is what HyperFormula's lexer reads as one: digits with an optional decimal
 * separator and digits, or a decimal separator and digits, then an optional exponent (`1,5`, `,5`,
 * `5,`, `1,5e3`). Only a literal that starts a token is one: a digit or separator right after a
 * name character or `$` belongs to a reference or a name (`A1`, `A$1`, `Sheet1`). String literals
 * and quoted sheet names are copied as they are. It runs before the references are mapped, so the
 * exponent of `1,e3` stays part of its number instead of reading as the reference `E3`.
 *
 * @private
 * @param {string} formula The formula, without the leading `=`.
 * @param {string} decimalSeparator HyperFormula's `decimalSeparator` (`'.'` or `','`).
 * @returns {string}
 */
export function toDotDecimalSeparator(formula: string, decimalSeparator: string): string {
  if (!decimalSeparator || decimalSeparator === '.' || !formula.includes(decimalSeparator)) {
    return formula;
  }

  let result = '';
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];
    const previous = formula[index - 1];
    const startsToken = previous === undefined || (previous !== '$' && !isNameChar(previous));

    if (char === '"' || char === '\'') {
      const end = skipQuoted(formula, index);

      result += formula.slice(index, end);
      index = end;

    } else if (startsToken && (isDigit(char) || (char === decimalSeparator && isDigit(formula[index + 1])))) {
      let end = index;

      while (isDigit(formula[end])) {
        end += 1;
      }

      result += formula.slice(index, end);

      if (formula[end] === decimalSeparator) {
        result += '.';
        end += 1;
      }

      index = end;

    } else if (isNameChar(char)) {
      let end = index + 1;

      while (end < formula.length && isNameChar(formula[end])) {
        end += 1;
      }

      result += formula.slice(index, end);
      index = end;

    } else {
      result += char;
      index += 1;
    }
  }

  return result;
}

/**
 * The values of each `Set` `countBelow` was asked about, sorted, with the set's size when they were
 * read: a set changed since is read again.
 */
const sortedSets = new WeakMap<Set<number>, { size: number; values: number[] }>();

/**
 * Counts how many values in a `Set` are strictly less than `threshold`. The set is sorted once and
 * then searched, so each call costs O(log n): with a `range` the set holds every engine row outside
 * it, and walking it for every reference corner of every name was quadratic on a large grid.
 *
 * @private
 * @param {Set<number>} set Set of numbers.
 * @param {number} threshold Upper bound (exclusive).
 * @returns {number}
 */
function countBelow(set: Set<number>, threshold: number): number {
  let sorted = sortedSets.get(set);

  if (sorted === undefined || sorted.size !== set.size) {
    sorted = { size: set.size, values: Array.from(set).sort((a, b) => a - b) };
    sortedSets.set(set, sorted);
  }

  const { values } = sorted;
  let low = 0;
  let high = values.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (values[middle] < threshold) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
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
 * Before all that, the decimal separator of every number literal becomes `.`
 * (`toDotDecimalSeparator`): under `decimalSeparator: ','` HyperFormula reads `1,5` as one and a
 * half, and Excel would read `SUM(A1,1,5)` as three arguments.
 *
 * @private
 * @param {string} formulaStr Raw formula string (starts with `=`).
 * @param {string} separator HyperFormula's `functionArgSeparator` (e.g. `','` or `';'`).
 * @param {number} rowOffset Base number to add to every row number in a cell reference.
 * @param {number} colOffset Base number to add to every column number in a cell reference.
 * @param {Set<number>} [excludedHiddenRows] The rows left out of the exported data matrix, as the
 *   row indexes the formula's references use (`ExportDataProvider#getExcludedHiddenRows`): with the
 *   Formulas plugin on, the engine rows that are trimmed, filtered out, or hidden and excluded;
 *   without it, the physical rows that are hidden and excluded. When provided, each row reference
 *   is further reduced by the number of excluded rows that precede it.
 * @param {Set<number>} [excludedHiddenCols] The columns left out of the exported data matrix, as
 *   the column indexes the formula's references use (`ExportDataProvider#getExcludedHiddenColumns`):
 *   with the Formulas plugin on, engine columns; without it, physical columns. When provided, each
 *   column reference is further reduced by the number of excluded columns that precede it.
 * @param {string} [decimalSeparator='.'] HyperFormula's `decimalSeparator` (`'.'` or `','`).
 * @returns {string}
 */
export function normalizeFormula(
  formulaStr: string,
  separator: string,
  rowOffset: number,
  colOffset: number,
  excludedHiddenRows?: Set<number>,
  excludedHiddenCols?: Set<number>,
  decimalSeparator = '.'
): string {
  let formula = toDotDecimalSeparator(formulaStr.startsWith('=') ? formulaStr.slice(1) : formulaStr, decimalSeparator);
  const hasRowExclusions = (excludedHiddenRows?.size ?? 0) > 0;
  const hasColExclusions = (excludedHiddenCols?.size ?? 0) > 0;

  if (rowOffset !== 0 || colOffset !== 0 || hasRowExclusions || hasColExclusions) {
    // `mapFormulaReferences` owns the walk (string literals and qualified references are copied
    // through untouched - the header band is prepended to this sheet only); this mapper owns the
    // arithmetic. Unlike the import
    // direction, the offset applies to ABSOLUTE components too: the whole data block moves to a new
    // origin in the sheet, which is a translation of the coordinate space rather than a copy, so a
    // `$A$1` pinned to a grid cell has to follow it. The mapper never rejects a reference, so the
    // result is never `null`.
    formula = mapFormulaReferences(formula, ({ row, col }) => {
      // An open axis (`null`, from a whole-column or whole-row span) stays open.
      const hiddenColsBefore = (col !== null && hasColExclusions && excludedHiddenCols)
        ? countBelow(excludedHiddenCols, col - 1) : 0;
      const hiddenRowsBefore = (row !== null && hasRowExclusions && excludedHiddenRows)
        ? countBelow(excludedHiddenRows, row - 1) : 0;

      return {
        row: row === null ? null : row + rowOffset - hiddenRowsBefore,
        col: col === null ? null : col + colOffset - hiddenColsBefore,
      };
    }) ?? formula;
  }

  if (separator && separator !== ',') {
    formula = replaceSeparatorOutsideStrings(formula, separator, ',');
  }

  return formula;
}

/**
 * Where the export put one engine sheet: the name the file gives it and the arithmetic that moves
 * a reference to it, as `normalizeFormula` applies it to that sheet's cell formulas.
 */
export interface ExportedEngineSheet {
  /**
   * The name the export gives the sheet.
   */
  exportedName: string;
  /**
   * Base number added to every row number of a reference (the column-header band).
   */
  rowOffset: number;
  /**
   * Base number added to every column number of a reference (the row-header band).
   */
  colOffset: number;
  /**
   * The rows left out of the export, as engine row indexes (`ExportDataProvider#getExcludedHiddenRows`).
   */
  excludedRows?: Set<number>;
  /**
   * The columns left out of the export (`ExportDataProvider#getExcludedHiddenColumns`).
   */
  excludedCols?: Set<number>;
}

/**
 * Builds the reference map of one exported engine sheet: the shift `normalizeFormula` applies to
 * its cell formulas, refusing a reference that names a left-out row or column itself.
 */
function exportedSheetMap(sheet: ExportedEngineSheet): ReferenceMap {
  const { rowOffset, colOffset, excludedRows, excludedCols } = sheet;

  return ({ row, col }) => {
    if ((row !== null && excludedRows?.has(row - 1)) || (col !== null && excludedCols?.has(col - 1))) {
      return null;
    }

    return {
      row: row === null ? null : row + rowOffset - (excludedRows ? countBelow(excludedRows, row - 1) : 0),
      col: col === null ? null : col + colOffset - (excludedCols ? countBelow(excludedCols, col - 1) : 0),
    };
  };
}

/**
 * Normalizes the definition of a HyperFormula named expression for an Excel defined name.
 *
 * A named expression qualifies every reference (`=Sheet1!$A$1:$A$3`), and one engine may serve
 * several grids of the export, so each reference is moved by the sheet it names: `sheets` maps
 * every engine sheet the export writes (its name lower-cased, as the engine compares names) to
 * the name the file gives it and the header band and left-out rows and columns of its grid. The
 * reference is shifted the way that grid's cell formulas are, `$` components included, and
 * qualified with the exported name. The definition cannot be expressed, and `null` is returned,
 * when a reference names a sheet the export does not write (the file has no such sheet), has no
 * sheet at all, or ends on a left-out row or column. A left-out row or column INSIDE a range
 * only shrinks it, the way a cell formula's range shrinks. The argument separator becomes `,` and
 * the decimal separator of a number literal `.`, and every `ARRAYFORMULA(…)` call is stripped, as in
 * a cell formula (Excel has no such function). A definition HyperFormula could not parse is stored
 * as `=#ERROR!`, which is no OOXML error code: it cannot be expressed either.
 *
 * @private
 * @param {string} formula The definition (with or without its leading `=`).
 * @param {string} separator HyperFormula's `functionArgSeparator`.
 * @param {Map<string, object>} sheets The exported engine sheets, by lower-cased engine sheet name.
 * @param {string} [decimalSeparator='.'] HyperFormula's `decimalSeparator`.
 * @returns {string|null} The definition without its `=`, or `null` when it cannot be expressed.
 */
export function normalizeNamedExpression(
  formula: string,
  separator: string,
  sheets: Map<string, ExportedEngineSheet>,
  decimalSeparator = '.'
): string | null {
  const text = formula.startsWith('=') ? formula.slice(1) : formula;

  if (/#ERROR!/i.test(text.replace(/"(?:[^"]|"")*"/g, '""'))) {
    return null;
  }

  const definition = toDotDecimalSeparator(stripArrayFormulaCalls(text), decimalSeparator);
  let unknownSheet = false;
  const mapped = mapFormulaReferences(definition, () => null, {
    requalify: (sheetName) => {
      const sheet = sheets.get(sheetName.toLowerCase());

      if (!sheet) {
        unknownSheet = true;

        return null;
      }

      return { sheetName: sheet.exportedName, map: exportedSheetMap(sheet) };
    },
  });

  if (mapped === null || unknownSheet) {
    return null;
  }

  return separator && separator !== ',' ? replaceSeparatorOutsideStrings(mapped, separator, ',') : mapped;
}

/**
 * HyperFormula's error types (`DetailedCellError#type`) that have an OOXML error code. The rest have
 * none: `CYCLE` (Excel reports a circular reference as a warning and shows `0`), `ERROR` (a formula
 * HyperFormula could not parse) and `LIC`. `SPILL` is left out too: `#SPILL!` is not one of the
 * seven codes ECMA-376 lists, and Apache POI's `FormulaError` refuses it in a `t="e"` cell. Those
 * results keep being cached as the text the grid shows.
 */
const HF_ERROR_TYPE_TO_OOXML_CODE = new Map<string, string>([
  ['DIV_BY_ZERO', '#DIV/0!'],
  ['NA', '#N/A'],
  ['NAME', '#NAME?'],
  ['NUM', '#NUM!'],
  ['REF', '#REF!'],
  ['VALUE', '#VALUE!'],
]);

/**
 * Returns the OOXML error code of a HyperFormula cell value that is an error (a
 * `DetailedCellError`, recognized by shape because HyperFormula is an optional dependency), or
 * `null` for any other value and for an error type with no OOXML code.
 *
 * The code comes from the error's `type`, never from its `value`: `value` is translated by the
 * engine's language (`#DZIEL/0!` under `plPL`), and a formula may answer the text `#N/A`.
 */
export function toOoxmlErrorCode(cellValue: unknown): string | null {
  if (typeof cellValue !== 'object' || cellValue === null) {
    return null;
  }

  const { type } = cellValue as { type?: unknown };

  return typeof type === 'string' ? HF_ERROR_TYPE_TO_OOXML_CODE.get(type) ?? null : null;
}

/**
 * The longest string literal Excel accepts in a formula, in characters.
 */
const MAX_FORMULA_STRING_LITERAL_LENGTH = 255;

/**
 * Whether a string literal would change on its way through the file. The writer drops every
 * character an XML 1.0 file cannot hold (`ILLEGAL_XML_CHAR`, the native writer's own set), and a
 * carriage return is written raw, so the reader's end-of-line handling turns it into a line feed
 * (`"a\rb"` read back as `"a\nb"`). A tab and a line feed survive. A lone surrogate is not a
 * character at all: `TextEncoder` writes U+FFFD in its place.
 */
function changesInFile(text: string): boolean {
  return text.includes('\r') || ILLEGAL_XML_CHAR.test(text) || !text.isWellFormed();
}

/**
 * Spells the constant value of a HyperFormula named expression (one defined with a value rather
 * than a formula) as an Excel formula literal: a finite number as it is, a string double-quoted
 * with every `"` doubled, a boolean as `TRUE()` or `FALSE()` (the function form, which every
 * reader parses as a boolean), and an error with an OOXML code as that code. Answers `null` for
 * anything else (an empty value, an error with no code, a string longer than the 255 characters
 * Excel accepts in a literal, a string with a character the file cannot hold or a carriage return), which no
 * definition can spell.
 *
 * @private
 * @param {*} value The value `getNamedExpressionValue()` answers.
 * @returns {string|null}
 */
export function toFormulaLiteral(value: unknown): string | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === 'string') {
    // Excel refuses a string literal longer than 255 characters in a formula.
    if (value.length > MAX_FORMULA_STRING_LITERAL_LENGTH || changesInFile(value)) {
      return null;
    }

    return `"${value.replaceAll('"', '""')}"`;
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE()' : 'FALSE()';
  }

  return toOoxmlErrorCode(value);
}

/**
 * A 1-based, inclusive cell range of a sheet.
 */
export interface SheetRange {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/**
 * The widest column index plus one, so `row * CLAIM_ROW_STRIDE + col` keys a cell uniquely.
 */
const CLAIM_ROW_STRIDE = 16385;

/**
 * The ranges a sheet's array formulas claimed. Two overlapping refs are invalid OOXML (Excel
 * repairs the file), and the size of an array can be an over-counting estimate
 * (`ExportDataProvider#getEngineCellFacts`), so an array whose range overlaps an earlier one is
 * written without its flag.
 *
 * The export claims master by master in row-major order (row by row, left to right), and every
 * range starts at its master. So a range overlaps an earlier claim exactly when an earlier claim
 * covers a cell of the range's FIRST row: the earlier range starts on that row or above it. A
 * one-cell claim never covers a cell a later master's first row reaches (that master starts right
 * of it or below it), so only the cells of multi-cell claims are kept, and a one-cell claim costs
 * O(1) - an `IFS` column of 100,000 rows used to cost a comparison with every earlier claim. The
 * kept cells never exceed the sheet's exported cells, because the claims do not overlap.
 *
 * A claim is refused over a merged cell too: Excel shows a dynamic array that spills into a merge as
 * `#SPILL!`, and does not take a CSE array in a merged cell at all. A one-cell dynamic array (`IFS`,
 * range arithmetic) is only a formula to Excel, so it may sit on a merge's first cell.
 *
 * @private
 */
export class ArrayRangeClaims {
  /**
   * The cells the multi-cell claims cover, keyed `row * CLAIM_ROW_STRIDE + col`.
   */
  #cells = new Set<number>();
  /**
   * The cells the sheet's merges cover, keyed like `#cells`.
   */
  #merged = new Set<number>();

  /**
   * @param {SheetRange[]} [merges] The sheet's merged ranges, 1-based like the claims.
   */
  constructor(merges: SheetRange[] = []) {
    merges.forEach(({ top, left, bottom, right }) => {
      for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
          this.#merged.add((row * CLAIM_ROW_STRIDE) + col);
        }
      }
    });
  }

  /**
   * Claims the range of an array formula, or answers `false` when it overlaps a range claimed
   * earlier or a merged cell. Ranges must be claimed in row-major order of their top-left corner.
   *
   * @param {object} range The range to claim.
   * @param {boolean} [dynamic=true] Whether the array is a dynamic one, which may sit on a merged
   *   cell when it is one cell.
   * @returns {boolean}
   */
  claim(range: SheetRange, dynamic = true): boolean {
    const { top, left, bottom, right } = range;
    const firstRow = top * CLAIM_ROW_STRIDE;

    for (let col = left; col <= right; col++) {
      if (this.#cells.has(firstRow + col)) {
        return false;
      }
    }

    if (top === bottom && left === right) {
      return dynamic || !this.#merged.has(firstRow + left);
    }

    const keys: number[] = [];

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        const key = (row * CLAIM_ROW_STRIDE) + col;

        if (this.#merged.has(key)) {
          return false;
        }

        keys.push(key);
      }
    }

    keys.forEach(key => this.#cells.add(key));

    return true;
  }
}
