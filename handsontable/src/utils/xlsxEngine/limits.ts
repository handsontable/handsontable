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
 * The longest formula text (`<f>`) the reader keeps, in characters. A longer formula is DROPPED —
 * the cell keeps its cached `<v>` as a plain value and `formula:tooLong` is recorded — rather than
 * refusing the workbook. The cap is four times Excel's 8192-character limit because that limit
 * counts what the formula bar shows, and the file holds more: Excel writes `_xlfn.`, `_xlws.` and
 * `_xlpm.` prefixes into `<f>` (`_xlpm.` on every `LET`/`LAMBDA` parameter reference), so a
 * formula at Excel's limit is longer in the file. Something must still bound the text: it is the
 * file's own, and the reference regex the shared-formula translation and the import's reference
 * shift both run over it costs up to about 0.3-0.8 us per character (the machine decides), so the
 * reader stops collecting a formula's text as soon as it crosses the cap.
 */
export const MAX_FORMULA_LENGTH = 32768;

/**
 * The largest number of formula characters the reader may run the shared-formula translation over
 * across one workbook read. Each slave cell of a shared formula re-translates its master's whole
 * text, so a sheet of 5 million slaves under a master at `MAX_FORMULA_LENGTH` was 160 billion
 * characters of synchronous regex work that no other cap bounded: `MAX_FORMULA_LENGTH` bounds one
 * formula and `MAX_WORKBOOK_CELLS` the slave count, but not their product. Every translation
 * charges the master's length. 32 Mi characters is room for about 330 000 slaves of a
 * 100-character formula, or 1.3 million of a 26-character one. The worst case is a dense run of
 * references (`A1+A1+...`, `A:A+...`, `A1:B2,...`), which rewrites one reference every few
 * characters: measured on 32 748-character masters, it cost 0.28-0.32 us per character on a
 * developer machine and 0.58-0.84 us on a reviewer's (300 runs each). A run of letters of any
 * script, of apostrophes or of digits, which rewrites nothing, costs 0.01-0.05 us. So the budget
 * bounds the worst case to about 10 s of blocking work on the first machine and 28 s on the second;
 * at the earlier 64 Mi the second machine allowed 39-56 s. These figures are measurements, kept
 * here and re-taken by hand: a wall-clock bound in a unit test flakes under parallel Jest workers,
 * so `nativeReadCompat.unit.js` pins the value and the exact `REFERENCE_REGEX` they were taken
 * with instead. Re-measure before changing either, then update that pin.
 */
export const MAX_TRANSLATED_FORMULA_CHARS = 32 * 1024 * 1024;

/**
 * The longest number-format code the reader keeps, in characters - the limit Excel itself puts on a
 * code. A longer one can only come from a file built to be expensive: the import classifies every
 * cell's code, so a megabyte-long code on twenty thousand cells cost minutes. It is dropped on read
 * and recorded once as a `numFmt:` dropped feature.
 */
export const MAX_NUM_FMT_CODE_LENGTH = 255;

/**
 * The floor of the import's per-cell meta budget. The mapper lifts each column's most common meta to
 * the column and expands only the rest into one `cellsMeta` entry per cell, and the grid then keeps
 * one meta object per such cell. Those cells need not hold any data: two list validations with
 * different formulas that split `A1:E1000000` in half expanded 2.5 million cells from a 2 kB file.
 * The mapper refuses a sheet whose expansion would pass the larger of this floor and the number of
 * cells that really hold a value or a formula, so a sheet of real data is never refused for the
 * settings its own cells carry.
 */
export const MIN_CELL_META_BUDGET = 1000000;

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
 * Refuses a sheet declaring more rows than the reader accepts. The wording is part of the reader's
 * contract, so every site that refuses a row count raises it through this helper rather than
 * rebuilding the sentence.
 */
export function throwRowLimit(name: string, rows: number): never {
  return throwLimitExceeded(`The sheet "${name}" declares ${rows} rows, `
    + `above the ${MAX_SHEET_ROWS}-row limit this reader accepts.`);
}

/**
 * Refuses a sheet declaring more columns than the reader accepts.
 */
export function throwColumnLimit(name: string, columns: number): never {
  return throwLimitExceeded(`The sheet "${name}" declares ${columns} columns, `
    + `above the ${MAX_SHEET_COLUMNS}-column limit this reader accepts.`);
}

/**
 * Refuses a sheet whose declared rectangle holds more cells than the reader accepts.
 */
export function throwCellLimit(name: string, rows: number, columns: number): never {
  return throwLimitExceeded(`The sheet "${name}" declares ${rows} \u00D7 ${columns} cells, `
    + `above the ${MAX_SHEET_CELLS}-cell limit this reader accepts.`);
}

/**
 * Whether an error is a refusal by one of the limits declared here, rather than a parse failure.
 */
export function isLimitError(error: unknown): boolean {
  return typeof error === 'object' && error !== null
    && (error as { cause?: { handsontable?: boolean; limit?: boolean } }).cause?.handsontable === true
    && (error as { cause?: { limit?: boolean } }).cause?.limit === true;
}
