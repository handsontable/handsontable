import { colIndexToLetter, colLetterToIndex } from './cellRef';

/**
 * One A1-style cell reference found in a formula, in 1-based spreadsheet coordinates. `rowAbsolute`
 * and `colAbsolute` say whether the component carried a `$`.
 */
export interface FormulaReference {
  /**
   * The 1-based row the reference points at.
   */
  row: number;
  /**
   * The 1-based column the reference points at.
   */
  col: number;
  /**
   * Whether the row component was written as absolute (`A$1`).
   */
  rowAbsolute: boolean;
  /**
   * Whether the column component was written as absolute (`$A1`).
   */
  colAbsolute: boolean;
}

/**
 * Where a mapper moves a reference to, in 1-based spreadsheet coordinates.
 */
export interface MappedReference {
  /**
   * The 1-based row the reference is rewritten to.
   */
  row: number;
  /**
   * The 1-based column the reference is rewritten to.
   */
  col: number;
}

/**
 * Matches either a token to copy through untouched or an A1-style cell reference to rewrite.
 *
 * The leading alternative captures the untouched tokens: a double-quoted Excel string (`""`
 * escapes a quote inside one) and a **qualified** reference - a sheet name, single-quoted
 * (`'Sheet 1'!B2`, with `''` escaping an apostrophe inside) or bare (`Data!A2`, letters and digits
 * of any script, `_` and `.`), followed by `!` and a cell or a range. A qualified
 * reference points at another sheet, and a header band added to or removed from THIS sheet moves
 * nothing there, so its cell part is left alone along with the name. The range form is captured
 * whole because the reference after the `:` inherits the qualifier.
 *
 * The second alternative is the reference itself: an optional `$` before each component, one to
 * three column letters, then up to seven row digits, matched case-insensitively because
 * HyperFormula accepts `=sum(a1)` and the export hands the source string over as typed (the
 * rewritten reference comes back uppercase). The leading `(?<![\p{L}\p{N}_.$])` keeps it from
 * starting inside a number, a defined name (`TOTAL1` must not yield `AL1`) or a structured
 * reference (`TABLE1[Col]`). The trailing `(?![\d(])` keeps a function name from reading as a reference: a bare
 * `(?!\()` lets the digit run backtrack, so `LOG10(` matches `G1` and is rewritten to `H2`, and
 * rejecting a following digit as well is what closes that. A real row number is never followed by
 * a digit, because the run is greedy.
 */
const CELL_PATTERN = String.raw`\$?[A-Z]{1,3}\$?\d{1,7}(?![\d(])`;
const REFERENCE_REGEX = new RegExp(
  String.raw`("(?:[^"]|"")*"|(?:'(?:[^']|'')*'|[\p{L}\p{N}_.]+)!${CELL_PATTERN}(?::${CELL_PATTERN})?)` +
  String.raw`|(?<![\p{L}\p{N}_.$])(\$?)([A-Z]{1,3})(\$?)(\d{1,7})(?![\d(])`,
  'giu'
);

/**
 * Rewrites every unqualified A1-style cell reference in a formula through `map`, leaving string
 * literals and qualified references (`Data!A2`, `'Sheet 1'!B2:C3`) untouched. Returns `null` when `map` rejects any
 * reference, so a caller that cannot express a reference in the target coordinate space can drop
 * the whole formula rather than emit a wrong one.
 *
 * The formula is expected without its leading `=`.
 */
export function mapFormulaReferences(
  formula: string,
  map: (reference: FormulaReference) => MappedReference | null
): string | null {
  let rejected = false;

  const rewritten = formula.replace(
    REFERENCE_REGEX,
    (match, literal, colAbs, colLetters, rowAbs, rowDigits) => {
      if (literal !== undefined) {
        return literal as string;
      }

      const moved = map({
        row: Number.parseInt(rowDigits as string, 10),
        col: colLetterToIndex(colLetters as string),
        rowAbsolute: rowAbs === '$',
        colAbsolute: colAbs === '$',
      });

      if (moved === null) {
        rejected = true;

        return match as string;
      }

      return `${colAbs}${colIndexToLetter(moved.col)}${rowAbs}${moved.row}`;
    }
  );

  return rejected ? null : rewritten;
}

/**
 * Shifts every unqualified A1-style cell reference in a formula by `rowDelta` rows and `colDelta`
 * columns, keeping each `$` marker where it was written. Ranges are shifted at both ends, because
 * each end is a reference of its own. A reference that names another sheet is left where it is:
 * the band this shift accounts for exists on this sheet only.
 *
 * An **absolute** component shifts like a relative one. This is a translation of the whole
 * coordinate space - a header band added by the export or removed by the import moves every cell
 * the formula could point at - and `$` pins a reference against copy and fill, not against the
 * sheet itself moving. `normalizeFormula` shifts `$A$1` to `$B$2` on the way out for the same
 * reason, and this is what shifts it back.
 *
 * Returns `null` when a shifted reference would land above row 1 or left of column A - it pointed
 * into a band that does not exist in the target coordinate space, so the formula cannot be
 * expressed there at all.
 *
 * The formula is expected without its leading `=`.
 */
export function shiftFormulaReferences(formula: string, rowDelta: number, colDelta: number): string | null {
  if (rowDelta === 0 && colDelta === 0) {
    return formula;
  }

  return mapFormulaReferences(formula, (reference) => {
    const row = reference.row + rowDelta;
    const col = reference.col + colDelta;

    return row < 1 || col < 1 ? null : { row, col };
  });
}
