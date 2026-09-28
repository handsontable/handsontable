import { MAX_SHEET_COLUMNS, MAX_SHEET_ROWS } from './limits';

/**
 * Converts a 1-based column index to its spreadsheet letter code (`1` → `A`, `27` → `AA`).
 */
export function colIndexToLetter(colIndex: number): string {
  let index = colIndex;
  let letters = '';

  while (index > 0) {
    const remainder = (index - 1) % 26;

    letters = String.fromCharCode(65 + remainder) + letters;
    index = Math.floor((index - 1) / 26);
  }

  return letters;
}

/**
 * Converts a spreadsheet column letter code to its 1-based index (`A` → `1`, `AA` → `27`).
 */
export function colLetterToIndex(letters: string): number {
  let index = 0;

  for (const char of letters.toUpperCase()) {
    index = (index * 26) + (char.charCodeAt(0) - 64);
  }

  return index;
}

/**
 * A parsed range reference in 1-based sheet coordinates.
 */
export interface RangeRef {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// A single cell reference: an optional `$` before each part, one to three column letters then up
// to seven row digits (`A1`, `$A$1`, `aa12`). Case-insensitive; anything else is not a cell
// reference. The runs are bounded on purpose: a reference comes verbatim from the file, and an
// unbounded `\d+` let `$A$1:$A$99999999999` parse into a range a reader then walked.
const CELL_REF_REGEX = /^\$?([A-Z]{1,3})\$?(\d{1,7})$/i;

// The open forms: a whole-column span (`A:A`, `$A:$C`) and a whole-row span (`1:1`, `$2:$3`).
const COLUMN_SPAN_REGEX = /^\$?([A-Z]{1,3}):\$?([A-Z]{1,3})$/i;
const ROW_SPAN_REGEX = /^\$?(\d{1,7}):\$?(\d{1,7})$/;

/**
 * Orders a range's corners and refuses one that reaches past the sheet limits.
 */
function toRange(rowA: number, colA: number, rowB: number, colB: number): RangeRef | null {
  const startRow = Math.min(rowA, rowB);
  const endRow = Math.max(rowA, rowB);
  const startCol = Math.min(colA, colB);
  const endCol = Math.max(colA, colB);

  if (startRow < 1 || startCol < 1 || endRow > MAX_SHEET_ROWS || endCol > MAX_SHEET_COLUMNS) {
    return null;
  }

  return { startRow, startCol, endRow, endCol };
}

/**
 * Parses `A1`, `$A$1`, `A1:B2`, `Sheet1!A1:B2`, a whole-column span `A:C` or a whole-row span `2:3`
 * into 1-based coordinates. An open axis spans the whole sheet (`MAX_SHEET_ROWS` or
 * `MAX_SHEET_COLUMNS`), so a consumer has to clamp it to the extent it actually holds. The corners
 * come back ordered. Returns `null` when the text is not a reference, or reaches past the limits.
 */
export function parseRangeRef(ref: string): RangeRef | null {
  const withoutSheet = ref.includes('!') ? ref.slice(ref.lastIndexOf('!') + 1) : ref;
  const columnSpan = withoutSheet.match(COLUMN_SPAN_REGEX);

  if (columnSpan) {
    return toRange(1, colLetterToIndex(columnSpan[1]), MAX_SHEET_ROWS, colLetterToIndex(columnSpan[2]));
  }

  const rowSpan = withoutSheet.match(ROW_SPAN_REGEX);

  if (rowSpan) {
    return toRange(parseInt(rowSpan[1], 10), 1, parseInt(rowSpan[2], 10), MAX_SHEET_COLUMNS);
  }

  const [start, end = start] = withoutSheet.split(':');
  const startMatch = start.match(CELL_REF_REGEX);
  const endMatch = end.match(CELL_REF_REGEX);

  if (!startMatch || !endMatch) {
    return null;
  }

  return toRange(
    parseInt(startMatch[2], 10), colLetterToIndex(startMatch[1]),
    parseInt(endMatch[2], 10), colLetterToIndex(endMatch[1]),
  );
}

/**
 * Parses the space-separated multi-range form Excel writes when one conditional format covers
 * several rectangles (`"A1:B2 D1:E2"`) into one entry per range. A single range or a bare cell
 * reference yields one entry; a part that is not a reference at all is skipped rather than failing
 * the whole reference, so one malformed rectangle cannot cost the others.
 *
 * The splitter assumes no quoted sheet prefix: a `'My Sheet'!A1:B2` part would be split at the space
 * inside the quotes. A conditional formatting `sqref` value never carries one, so this is safe here.
 */
export function parseMultiRangeRef(ref: string): RangeRef[] {
  return ref
    .split(/\s+/)
    .filter(part => part !== '')
    .map(part => parseRangeRef(part))
    .filter((range): range is RangeRef => range !== null);
}

/**
 * Builds a range reference such as `B2:E7` from 1-based coordinates.
 */
export function toRangeRef(startRow: number, startCol: number, endRow: number, endCol: number): string {
  return `${colIndexToLetter(startCol)}${startRow}:${colIndexToLetter(endCol)}${endRow}`;
}
