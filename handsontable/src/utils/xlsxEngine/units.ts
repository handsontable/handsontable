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

/**
 * The widest `<col width>` either import step accepts, in Excel column-width units. Excel's UI caps a
 * column at 255 characters, but the stored width adds the cell's 5 px of padding (ECMA-376
 * 18.3.1.13: `Truncate((chars * MDW + 5) / MDW * 256) / 256`, where MDW is the maximum digit width in
 * pixels), so a 255-character column is written as `255.7109375` with Calibri 11 (MDW 7). The stored
 * value is at most `255 + 5 / MDW`, which is 260 at a 1 px MDW, so 260 keeps a full-width column at
 * any font; a wider value did not come from Excel.
 */
export const MAX_COLUMN_WIDTH_UNITS = 260;

/**
 * The tallest `<row ht>` either import step accepts, in points: Excel's own row-height maximum. A
 * taller value did not come from Excel.
 */
export const MAX_ROW_HEIGHT_POINTS = 409.5;
