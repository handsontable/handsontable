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
