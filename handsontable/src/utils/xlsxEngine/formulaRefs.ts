import { colIndexToLetter, colLetterToIndex } from './cellRef';
import { MAX_SHEET_COLUMNS, MAX_SHEET_ROWS } from './limits';

/**
 * One A1-style reference found in a formula, in 1-based spreadsheet coordinates. `rowAbsolute` and
 * `colAbsolute` say whether the component carried a `$`. An open reference - one end of a
 * whole-column span such as `A:C`, or of a whole-row span such as `2:3` - carries `null` on the axis
 * it does not name.
 */
export interface FormulaReference {
  /**
   * The 1-based row the reference points at, or `null` for a whole-column reference.
   */
  row: number | null;
  /**
   * The 1-based column the reference points at, or `null` for a whole-row reference.
   */
  col: number | null;
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
   * The 1-based row the reference is rewritten to; `null` keeps a whole-column reference open.
   */
  row: number | null;
  /**
   * The 1-based column the reference is rewritten to; `null` keeps a whole-row reference open.
   */
  col: number | null;
}

/**
 * Matches either a token to copy through untouched or a reference to rewrite.
 *
 * The leading alternative captures the untouched tokens: a double-quoted Excel string (`""`
 * escapes a quote inside one) and a **qualified** reference - a sheet name, single-quoted
 * (`'Sheet 1'!B2`, with `''` escaping an apostrophe inside) or bare (`Data!A2`, letters and digits
 * of any script, `_` and `.`), followed by `!` and a cell, a range, a whole-column span or a
 * whole-row span. A qualified reference points at another sheet, and a header band added to or
 * removed from THIS sheet moves nothing there, so its cell part is left alone along with the name.
 * The range form is captured whole because the reference after the `:` inherits the qualifier.
 *
 * The next alternative is the cell reference itself: an optional `$` before each component, one to
 * three column letters, then up to seven row digits, matched case-insensitively because
 * HyperFormula accepts `=sum(a1)` and the export hands the source string over as typed (the
 * rewritten reference comes back uppercase). The leading `(?<![\p{L}\p{N}_.$])` keeps it from
 * starting inside a number, a defined name (`TOTAL1` must not yield `AL1`) or a structured
 * reference (`TABLE1[Col]`). The trailing `(?![\d(])` keeps a function name from reading as a
 * reference: a bare `(?!\()` lets the digit run backtrack, so `LOG10(` matches `G1` and is
 * rewritten to `H2`, and rejecting a following digit as well is what closes that. A real row number
 * is never followed by a digit, because the run is greedy.
 *
 * The last two alternatives are the open spans, `A:C` and `2:3`, each end its own reference with
 * `null` on the open axis. They come after the cell alternative so `A1:B2` is read as two cells,
 * never as a column span starting at `A`.
 */
const CELL_PATTERN = String.raw`\$?[A-Z]{1,3}\$?\d{1,7}(?![\d(])`;
const COLUMN_SPAN_PATTERN = String.raw`\$?[A-Z]{1,3}:\$?[A-Z]{1,3}(?![\p{L}\p{N}_(])`;
const ROW_SPAN_PATTERN = String.raw`\$?\d{1,7}:\$?\d{1,7}(?![\d\p{L}])`;
const REFERENCE_REGEX = new RegExp(
  String.raw`(?<literal>"(?:[^"]|"")*"|(?:'(?:[^']|'')*'|[\p{L}\p{N}_.]+)!` +
  String.raw`(?:${CELL_PATTERN}(?::${CELL_PATTERN})?|${COLUMN_SPAN_PATTERN}|${ROW_SPAN_PATTERN}))` +
  String.raw`|(?<![\p{L}\p{N}_.$])(?<colAbs>\$?)(?<colLetters>[A-Z]{1,3})(?<rowAbs>\$?)(?<rowDigits>\d{1,7})(?![\d(])` +
  String.raw`|(?<![\p{L}\p{N}_.$])(?<c1Abs>\$?)(?<c1>[A-Z]{1,3}):(?<c2Abs>\$?)(?<c2>[A-Z]{1,3})(?![\p{L}\p{N}_(])` +
  String.raw`|(?<![\p{L}\p{N}_.$:])(?<r1Abs>\$?)(?<r1>\d{1,7}):(?<r2Abs>\$?)(?<r2>\d{1,7})(?![\d\p{L}])`,
  'giu'
);

/**
 * The named groups `REFERENCE_REGEX` produces, every one optional because each alternative fills
 * its own.
 */
type ReferenceGroups = Partial<Record<
  'literal' | 'colAbs' | 'colLetters' | 'rowAbs' | 'rowDigits'
  | 'c1Abs' | 'c1' | 'c2Abs' | 'c2' | 'r1Abs' | 'r1' | 'r2Abs' | 'r2',
  string
>>;

/**
 * Rewrites one end of an open span through `map`, or returns `null` when `map` rejects it.
 */
function mapOpenEnd(
  reference: FormulaReference, abs: string, map: (reference: FormulaReference) => MappedReference | null
): string | null {
  const moved = map(reference);

  if (moved === null) {
    return null;
  }

  if (reference.row === null) {
    return `${abs}${colIndexToLetter(moved.col ?? reference.col ?? 1)}`;
  }

  return `${abs}${moved.row ?? reference.row}`;
}

/**
 * Rewrites every unqualified A1-style reference in a formula through `map`, leaving string
 * literals and qualified references (`Data!A2`, `'Sheet 1'!B2:C3`) untouched. An open span's ends
 * reach `map` with `null` on the open axis and keep it open however `map` answers. Returns `null` when `map` rejects any
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

  const rewritten = formula.replace(REFERENCE_REGEX, (match: string, ...args: unknown[]) => {
    const groups = args[args.length - 1] as ReferenceGroups;

    if (groups.literal !== undefined) {
      return groups.literal;
    }

    if (groups.colLetters !== undefined) {
      const moved = map({
        row: Number.parseInt(groups.rowDigits ?? '0', 10),
        col: colLetterToIndex(groups.colLetters),
        rowAbsolute: groups.rowAbs === '$',
        colAbsolute: groups.colAbs === '$',
      });

      if (moved === null || moved.row === null || moved.col === null) {
        rejected = true;

        return match;
      }

      return `${groups.colAbs}${colIndexToLetter(moved.col)}${groups.rowAbs}${moved.row}`;
    }

    const columnEnd = (letters: string | undefined, abs: string | undefined): [FormulaReference, string] => [
      { row: null, col: colLetterToIndex(letters ?? ''), rowAbsolute: false, colAbsolute: abs === '$' }, abs ?? '',
    ];
    const rowEnd = (digits: string | undefined, abs: string | undefined): [FormulaReference, string] => [
      { row: Number.parseInt(digits ?? '0', 10), col: null, rowAbsolute: abs === '$', colAbsolute: false }, abs ?? '',
    ];
    const ends = groups.c1 !== undefined
      ? [columnEnd(groups.c1, groups.c1Abs), columnEnd(groups.c2, groups.c2Abs)]
      : [rowEnd(groups.r1, groups.r1Abs), rowEnd(groups.r2, groups.r2Abs)];
    const [first, second] = ends.map(([reference, abs]) => mapOpenEnd(reference, abs, map));

    if (first === null || second === null) {
      rejected = true;

      return match;
    }

    return `${first}:${second}`;
  });

  return rejected ? null : rewritten;
}

/**
 * Shifts every unqualified A1-style reference in a formula by `rowDelta` rows and `colDelta`
 * columns, keeping each `$` marker where it was written. Ranges are shifted at both ends, because
 * each end is a reference of its own; a whole-column span (`A:A`) moves on the column axis only and
 * a whole-row span (`2:2`) on the row axis only. A reference that names another sheet is left where
 * it is: the band this shift accounts for exists on this sheet only.
 *
 * An **absolute** component shifts like a relative one. This is a translation of the whole
 * coordinate space - a header band added by the export or removed by the import moves every cell
 * the formula could point at - and `$` pins a reference against copy and fill, not against the
 * sheet itself moving. `normalizeFormula` shifts `$A$1` to `$B$2` on the way out for the same
 * reason, and this is what shifts it back.
 *
 * Returns `null` when a shifted reference would land above row 1 or left of column A - it pointed
 * into a band that does not exist in the target coordinate space, so the formula cannot be
 * expressed there at all - or past the last row or column a sheet can hold.
 *
 * The formula is expected without its leading `=`.
 */
export function shiftFormulaReferences(formula: string, rowDelta: number, colDelta: number): string | null {
  if (rowDelta === 0 && colDelta === 0) {
    return formula;
  }

  return mapFormulaReferences(formula, (reference) => {
    const row = reference.row === null ? null : reference.row + rowDelta;
    const col = reference.col === null ? null : reference.col + colDelta;

    // Symmetric with `parseRangeRef`: a reference the shift pushes off either edge of the sheet is
    // one the target coordinate space cannot hold.
    const rowOut = row !== null && (row < 1 || row > MAX_SHEET_ROWS);
    const colOut = col !== null && (col < 1 || col > MAX_SHEET_COLUMNS);

    return rowOut || colOut ? null : { row, col };
  });
}
