import { colIndexToLetter, colLetterToIndex } from '../../../../utils/xlsxEngine/cellRef';
import { mapFormulaReferences, type ReferenceMap } from '../../../../utils/xlsxEngine/formulaRefs';

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
 * @param {Set<number>} [excludedHiddenRows] The rows left out of the exported data matrix, as the
 *   row indexes the formula's references use (`ExportDataProvider#getExcludedHiddenRows`): with the
 *   Formulas plugin on, the engine rows that are trimmed, filtered out, or hidden and excluded;
 *   without it, the physical rows that are hidden and excluded. When provided, each row reference
 *   is further reduced by the number of excluded rows that precede it.
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
 * only shrinks it, the way a cell formula's range shrinks. The argument separator becomes `,`.
 *
 * @private
 * @param {string} formula The definition (with or without its leading `=`).
 * @param {string} separator HyperFormula's `functionArgSeparator`.
 * @param {Map<string, object>} sheets The exported engine sheets, by lower-cased engine sheet name.
 * @returns {string|null} The definition without its `=`, or `null` when it cannot be expressed.
 */
export function normalizeNamedExpression(
  formula: string,
  separator: string,
  sheets: Map<string, ExportedEngineSheet>
): string | null {
  const definition = formula.startsWith('=') ? formula.slice(1) : formula;
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
 * Spells the constant value of a HyperFormula named expression (one defined with a value rather
 * than a formula) as an Excel formula literal: a finite number as it is, a string double-quoted
 * with every `"` doubled, a boolean as `TRUE()` or `FALSE()` (the function form, which every
 * reader parses as a boolean), and an error with an OOXML code as that code. Answers `null` for
 * anything else (an empty value, an error with no code, a string longer than the 255 characters
 * Excel accepts in a literal), which no definition can spell.
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
    return value.length > MAX_FORMULA_STRING_LITERAL_LENGTH ? null : `"${value.replaceAll('"', '""')}"`;
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE()' : 'FALSE()';
  }

  return toOoxmlErrorCode(value);
}
