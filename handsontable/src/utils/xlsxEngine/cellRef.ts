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

// A single cell reference: an optional `$` before each part, column letters then a row number
// (`A1`, `$A$1`, `aa12`). Case-insensitive; anything else is not a cell reference.
const CELL_REF_REGEX = /^\$?([A-Z]+)\$?(\d+)$/i;

/**
 * Parses `A1`, `$A$1`, `A1:B2` or `Sheet1!A1:B2` into 1-based coordinates. Returns `null` when the
 * text is not a cell or range reference.
 */
export function parseRangeRef(ref: string): RangeRef | null {
  const withoutSheet = ref.includes('!') ? ref.slice(ref.lastIndexOf('!') + 1) : ref;
  const [start, end = start] = withoutSheet.split(':');
  const startMatch = start.match(CELL_REF_REGEX);
  const endMatch = end.match(CELL_REF_REGEX);

  if (!startMatch || !endMatch) {
    return null;
  }

  return {
    startRow: parseInt(startMatch[2], 10),
    startCol: colLetterToIndex(startMatch[1]),
    endRow: parseInt(endMatch[2], 10),
    endCol: colLetterToIndex(endMatch[1]),
  };
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
