import { stringify } from '../../helpers/mixed';

/**
 * Normalize a cell value for the Excel workbook.
 *
 * @param {*} value Cell value.
 * @param {boolean} formulas Enable formula export.
 * @returns {*}
 */
export function normalizeCellValue(value, formulas = false) {
  if (value === null || value === undefined) {
    return '';
  }

  if (formulas && typeof value === 'string' && value.length > 1 && value.startsWith('=')) {
    return {
      formula: value.slice(1),
    };
  }

  if (typeof value === 'object' && !(value instanceof Date)) {
    return stringify(value);
  }

  return value;
}

/**
 * Build workbook from Handsontable export data.
 *
 * @param {object} exceljs ExcelJS namespace with Workbook constructor.
 * @param {object} options Workbook options.
 * @param {string} options.sheetName Sheet name.
 * @param {Array} options.data 2D array of data rows.
 * @param {Array} options.rowHeaders Row headers.
 * @param {Array} options.columnHeaders Column headers.
 * @param {boolean} options.formulas Whether formulas should be exported.
 * @returns {object}
 */
export function createWorkbook(exceljs, {
  sheetName,
  data,
  rowHeaders,
  columnHeaders,
  formulas,
}) {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  const hasColumnHeaders = columnHeaders.length > 0;
  const hasRowHeaders = rowHeaders.length > 0;

  if (hasColumnHeaders) {
    const headerRow = [...columnHeaders];

    if (hasRowHeaders) {
      headerRow.unshift('');
    }

    worksheet.addRow(headerRow);
  }

  data.forEach((row, rowIndex) => {
    const workbookRow = row.map(cellValue => normalizeCellValue(cellValue, formulas));

    if (hasRowHeaders) {
      workbookRow.unshift(normalizeCellValue(rowHeaders[rowIndex], false));
    }

    worksheet.addRow(workbookRow);
  });

  return workbook;
}
