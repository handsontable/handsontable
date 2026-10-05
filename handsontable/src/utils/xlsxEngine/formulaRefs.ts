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
 * The leading alternative captures a double-quoted Excel string (`""` escapes a quote inside one),
 * which is always copied through untouched. The next captures a **qualified** reference - a sheet
 * name, single-quoted (`'Sheet 1'!B2`, with `''` escaping an apostrophe inside) or bare (`Data!A2`,
 * letters and digits of any script, `_` and `.`), followed by `!` and a cell, a range, a
 * whole-column span or a whole-row span - as two groups, the qualifier with its `!` and the
 * reference part. A qualified reference points at another sheet, so a header band added to or
 * removed from THIS sheet moves nothing there and `shiftFormulaReferences` copies it through whole;
 * a shared formula's copy rule moves it like any other reference, so `translateSharedFormula` asks
 * for its reference part to be mapped too. The range form is captured whole because the reference
 * after the `:` inherits the qualifier.
 * Neither name may start inside a run that could have started it earlier: the bare name only where
 * a run of name characters starts (`(?<![\p{L}\p{N}_.])`), the quoted one only at an apostrophe
 * that does not follow another. Tried from every position, the run is re-scanned once per
 * character of a long run of letters - or of apostrophes - with no `!` (or `'!`) after it, which
 * is quadratic in the formula's length (bounded at 255, still 255 steps per character: about
 * 6.4 us per character on Cyrillic), and the formula is the file's own text. The quoted body is
 * also bounded at `MAX_QUALIFIER_LENGTH` units (a character or an escaped `''`). A sheet name is
 * at most 31 characters (62 once every apostrophe is doubled), and a valid formula never places
 * a name inside a longer run or an opening apostrophe right after another, so neither rule
 * changes a match a workbook can produce; a bare name longer than any real one still reads as a
 * qualifier.
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
const MAX_QUALIFIER_LENGTH = 255;
const CELL_PATTERN = String.raw`\$?[A-Z]{1,3}\$?\d{1,7}(?![\d(])`;
const COLUMN_SPAN_PATTERN = String.raw`\$?[A-Z]{1,3}:\$?[A-Z]{1,3}(?![\p{L}\p{N}_(])`;
const ROW_SPAN_PATTERN = String.raw`\$?\d{1,7}:\$?\d{1,7}(?![\d\p{L}])`;
const QUOTED_QUALIFIER_PATTERN = String.raw`(?<!')'(?:[^']|''){0,${MAX_QUALIFIER_LENGTH}}'`;
const BARE_QUALIFIER_PATTERN = String.raw`(?<![\p{L}\p{N}_.])[\p{L}\p{N}_.]+`;
const UNQUALIFIED_PATTERN =
  String.raw`(?<![\p{L}\p{N}_.$])(?<colAbs>\$?)(?<colLetters>[A-Z]{1,3})(?<rowAbs>\$?)(?<rowDigits>\d{1,7})(?![\d(])` +
  String.raw`|(?<![\p{L}\p{N}_.$])(?<c1Abs>\$?)(?<c1>[A-Z]{1,3}):(?<c2Abs>\$?)(?<c2>[A-Z]{1,3})(?![\p{L}\p{N}_(])` +
  String.raw`|(?<![\p{L}\p{N}_.$:])(?<r1Abs>\$?)(?<r1>\d{1,7}):(?<r2Abs>\$?)(?<r2>\d{1,7})(?![\d\p{L}])`;

export const REFERENCE_REGEX = new RegExp(
  String.raw`(?<literal>"(?:[^"]|"")*")` +
  String.raw`|(?<qualifier>(?:${QUOTED_QUALIFIER_PATTERN}|${BARE_QUALIFIER_PATTERN})!)` +
  String.raw`(?<qualified>${CELL_PATTERN}(?::${CELL_PATTERN})?|${COLUMN_SPAN_PATTERN}|${ROW_SPAN_PATTERN})` +
  String.raw`|${UNQUALIFIED_PATTERN}`,
  'giu'
);

/**
 * The unqualified alternatives of `REFERENCE_REGEX` on their own, run over the reference part of a
 * qualified match (`B2:C3` of `Data!B2:C3`) when the caller asked for qualified references to be
 * mapped too. A separate instance, so the walk over that short part never shares `lastIndex` with
 * the walk over the whole formula.
 */
const QUALIFIED_PART_REGEX = new RegExp(UNQUALIFIED_PATTERN, 'giu');

/**
 * The named groups `REFERENCE_REGEX` produces, every one optional because each alternative fills
 * its own.
 */
type ReferenceGroups = Partial<Record<
  'literal' | 'qualifier' | 'qualified' | 'colAbs' | 'colLetters' | 'rowAbs' | 'rowDigits'
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
 * What `mapFormulaReferences` rewrites besides the unqualified references it always maps.
 */
export interface MapFormulaReferencesOptions {
  /**
   * Whether a qualified reference (`Data!A2`, `'Sheet 1'!B2:C3`) is mapped too, its sheet name kept
   * as written. Off by default: a header band exists on one sheet only.
   */
  qualified?: boolean;
}

/**
 * The reference callback `mapFormulaReferences` takes.
 */
type ReferenceMap = (reference: FormulaReference) => MappedReference | null;

/**
 * Rewrites one cell reference through `map`, or returns `null` when `map` rejects it or leaves it
 * open on an axis a cell reference must name.
 */
function mapCell(groups: ReferenceGroups, map: ReferenceMap): string | null {
  const moved = map({
    row: Number.parseInt(groups.rowDigits ?? '0', 10),
    col: colLetterToIndex(groups.colLetters ?? ''),
    rowAbsolute: groups.rowAbs === '$',
    colAbsolute: groups.colAbs === '$',
  });

  if (moved === null || moved.row === null || moved.col === null) {
    return null;
  }

  return `${groups.colAbs}${colIndexToLetter(moved.col)}${groups.rowAbs}${moved.row}`;
}

/**
 * Rewrites one whole-column (`A:C`) or whole-row (`2:3`) span through `map`, each end on its own,
 * or returns `null` when `map` rejects either end.
 */
function mapSpan(groups: ReferenceGroups, map: ReferenceMap): string | null {
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
    return null;
  }

  return `${first}:${second}`;
}

/**
 * Walks `formula` with `regex` and rewrites every reference it finds through `map`. Returns `null`
 * when `map` rejects any of them.
 */
function rewriteReferences(formula: string, regex: RegExp, map: ReferenceMap, qualified: boolean): string | null {
  let rejected = false;

  const rewritten = formula.replace(regex, (match: string, ...args: unknown[]) => {
    const groups = args[args.length - 1] as ReferenceGroups;
    let replacement: string | null;

    if (groups.literal !== undefined) {
      replacement = match;

    } else if (groups.qualifier !== undefined) {
      // The reference part is a cell, a range or a span of at most a few dozen characters, so the
      // second walk is bounded whatever the formula holds.
      const part = qualified
        ? rewriteReferences(groups.qualified ?? '', QUALIFIED_PART_REGEX, map, false)
        : (groups.qualified ?? '');

      replacement = part === null ? null : `${groups.qualifier}${part}`;

    } else {
      replacement = groups.colLetters !== undefined ? mapCell(groups, map) : mapSpan(groups, map);
    }

    if (replacement === null) {
      rejected = true;

      return match;
    }

    return replacement;
  });

  return rejected ? null : rewritten;
}

/**
 * Rewrites every unqualified A1-style reference in a formula through `map`, leaving string
 * literals untouched, and qualified references (`Data!A2`, `'Sheet 1'!B2:C3`) too unless
 * `options.qualified` is set - then their reference part is mapped as well and the sheet name kept.
 * An open span's ends reach `map` with `null` on the open axis and keep it open however `map`
 * answers. Returns `null` when `map` rejects any reference, so a caller that cannot express a
 * reference in the target coordinate space can drop the whole formula rather than emit a wrong one.
 *
 * The formula is expected without its leading `=`.
 */
export function mapFormulaReferences(
  formula: string,
  map: ReferenceMap,
  options: MapFormulaReferencesOptions = {}
): string | null {
  return rewriteReferences(formula, REFERENCE_REGEX, map, options.qualified === true);
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

/**
 * Translates a shared formula from its master cell to a slave cell `rowDelta` rows and `colDelta`
 * columns away. Unlike `shiftFormulaReferences`, which moves a whole coordinate space and so
 * shifts `$` components too, a shared formula follows Excel's copy rule: a `$`-pinned component
 * stays where it is. The copy rule moves a QUALIFIED reference too - `=Data!B2` filled down reads
 * `=Data!B3`, in Excel and in ExcelJS's `slideFormula` - so unlike `shiftFormulaReferences` this
 * maps the reference part of `Data!B2` and `'My Rates'!A1` and keeps the sheet name. Returns `null`
 * when a shifted reference would fall off the sheet.
 */
export function translateSharedFormula(formula: string, rowDelta: number, colDelta: number): string | null {
  if (rowDelta === 0 && colDelta === 0) {
    return formula;
  }

  return mapFormulaReferences(formula, (reference) => {
    const row = reference.row === null || reference.rowAbsolute ? reference.row : reference.row + rowDelta;
    const col = reference.col === null || reference.colAbsolute ? reference.col : reference.col + colDelta;
    const rowOut = row !== null && (row < 1 || row > MAX_SHEET_ROWS);
    const colOut = col !== null && (col < 1 || col > MAX_SHEET_COLUMNS);

    return rowOut || colOut ? null : { row, col };
  }, { qualified: true });
}
