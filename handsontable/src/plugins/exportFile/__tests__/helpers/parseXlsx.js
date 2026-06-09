import ExcelJS from 'exceljs';

/**
 * Exports the current Handsontable instance as XLSX and loads it back with ExcelJS.
 *
 * @param {object} [options] Export options passed to `_createTypeFormatter`.
 * @returns {Promise<object>} The first worksheet in the exported workbook.
 */
export async function parseXlsx(options = {}) {
  const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx', options).export();
  const wb = new ExcelJS.Workbook();

  await wb.xlsx.load(buffer);

  return wb.worksheets[0];
}

/**
 * Exports the current Handsontable instance as XLSX and loads all worksheets back.
 *
 * @param {object} [options] Export options passed to `_createTypeFormatter`.
 * @returns {Promise<object[]>} All worksheets in the exported workbook.
 */
export async function parseXlsxAllSheets(options = {}) {
  const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx', options).export();
  const wb = new ExcelJS.Workbook();

  await wb.xlsx.load(buffer);

  return wb.worksheets;
}
