import Handsontable from 'handsontable';

/**
 * Read a cell.
 *
 * @param {import('handsontable/common').CellValue} value The value.
 * @returns {import("handsontable/common").RowObject} A row.
 */
export function read(value) {
  return { value };
}

/** @type {import('handsontable/common').GridSettings} */
export const settings = { colHeaders: true };

// An unrelated type: @type {import('handsontable/plugins').Plugin}
export const grid = Handsontable;
