/**
 * SheetClip type definitions.
 */

/**
 * Data type for a cell in a spreadsheet.
 * Can be a string, number, boolean, null, or undefined.
 */
export type CellData = string | number | boolean | null | undefined;

/**
 * Represents a row of cells in a spreadsheet.
 */
export type RowData = CellData[];

/**
 * Represents a two-dimensional array of data that makes up a spreadsheet.
 */
export type SheetData = RowData[]; 