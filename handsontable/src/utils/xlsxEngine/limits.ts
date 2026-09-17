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
