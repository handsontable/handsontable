import { throwWithCause } from '../../helpers/errors';

/**
 * The highest row number an OOXML worksheet may declare. A file claiming more than this is either
 * corrupt or hand-crafted to make a reader allocate an array it can never fill.
 */
export const MAX_SHEET_ROWS = 1048576;

/**
 * The highest column number an OOXML worksheet may declare, `XFD` in A1 notation.
 */
export const MAX_SHEET_COLUMNS = 16384;

/**
 * The largest `rows × columns` rectangle a single sheet may be read into. Both dimensions can sit
 * inside their own limit and still describe a rectangle no browser tab survives materializing, so
 * the product is capped on its own: a sheet with a cell at `XFD1048576` is 17 billion cells.
 */
export const MAX_SHEET_CELLS = 5000000;

/**
 * The largest number of cells a whole workbook may declare across its sheets, each sheet counted as
 * `rows × max(columns, 1)`. The per-sheet cap bounds one rectangle; without a workbook total, a file
 * declaring many sheets that each sit inside it multiplies the allocation with nothing bounding the
 * sum.
 */
export const MAX_WORKBOOK_CELLS = 10000000;

/**
 * The largest input the reader hands to an engine, in bytes. Every other cap here runs after the
 * engine has parsed the file, so this is the only guard against an archive whose entries inflate
 * to far more than the file's own size.
 */
export const MAX_INPUT_BYTES = 128 * 1024 * 1024;

/**
 * The largest number of bytes one archive entry may inflate to. `MAX_INPUT_BYTES` bounds the file;
 * a DEFLATE stream can inflate to a thousand times its size, so the entry is bounded on its own
 * while it is being inflated, before any part is parsed.
 */
export const MAX_INFLATED_ENTRY_BYTES = 4 * MAX_INPUT_BYTES;

/**
 * The largest number of `<sheet>` entries a workbook part may declare. Every entry costs a full
 * inflate plus a tokenize of the part it points at, and nothing else bounds that work: the entries
 * are a few dozen bytes each inside `xl/workbook.xml`, they compress about 20:1, and they may all
 * point at the same worksheet part, so a 104 kB archive declaring 20 000 of them kept the main
 * thread busy for 32 s and still resolved. Excel's own practical ceiling is in the low thousands
 * (the format's limit is "available memory"), so 2048 leaves every real workbook untouched while
 * bounding the multiplication.
 */
export const MAX_WORKBOOK_SHEETS = 2048;

/**
 * The largest number of bytes every archive entry read during one workbook read may inflate to,
 * summed. `MAX_INPUT_BYTES` bounds the compressed file and `MAX_INFLATED_ENTRY_BYTES` bounds one
 * entry, but neither bounds the sum, so a 408 kB archive holding one 400 MB part — or a handful of
 * parts each just under the per-entry cap — stayed inside every declared limit while costing
 * gigabytes of resident memory. Twice `MAX_INPUT_BYTES` leaves room for the parts this reader
 * actually inflates (the workbook, its rels, `styles.xml`, `sharedStrings.xml` and each sheet) out
 * of a file at the input cap, and refuses the 1 000× amplification a crafted archive aims for.
 */
export const MAX_INFLATED_TOTAL_BYTES = 2 * MAX_INPUT_BYTES;

/**
 * Throws the refusal every cap in this module reports, tagging the error so a caller can tell a
 * declared limit apart from a parse failure without matching on the message text.
 *
 * `throwWithCause` is the only thrower this package may use and it assigns the cause itself, so the
 * flag is added to the error it threw rather than passed in.
 */
export function throwLimitExceeded(message: string): never {
  try {
    throwWithCause(message);
  } catch (error) {
    const cause = (error as { cause?: { limit?: boolean } }).cause;

    if (cause) {
      cause.limit = true;
    }

    throw error;
  }
}

/**
 * Whether an error is a refusal by one of the limits declared here, rather than a parse failure.
 */
export function isLimitError(error: unknown): boolean {
  return typeof error === 'object' && error !== null
    && (error as { cause?: { handsontable?: boolean; limit?: boolean } }).cause?.handsontable === true
    && (error as { cause?: { limit?: boolean } }).cause?.limit === true;
}
