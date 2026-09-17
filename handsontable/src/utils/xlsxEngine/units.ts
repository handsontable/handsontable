/**
 * Approximate number of CSS pixels occupied by one Excel column-width unit (the character width of
 * the "Normal" style font at the default font size). The export divides a Handsontable pixel width
 * by it; the import multiplies an Excel width by it.
 */
export const PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT = 7;

/**
 * Typographic points per CSS pixel (1 pt = 1/72 in, 1 px = 1/96 in, so 1 px = 72/96 = 0.75 pt). The
 * export multiplies a Handsontable pixel height by it; the import divides an Excel point height by it.
 */
export const POINTS_PER_PIXEL = 0.75;
