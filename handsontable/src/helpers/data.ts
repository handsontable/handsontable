import { deepObjectSize, isObject } from './object';

const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc.
 *
 * @param {number} index Column index.
 * @returns {string}
 */
export function spreadsheetColumnLabel(index) {
  let dividend = index + 1;
  let columnLabel = '';
  let modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % COLUMN_LABEL_BASE_LENGTH;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / COLUMN_LABEL_BASE_LENGTH, 10);
  }

  return columnLabel;
}

/**
 * Generates spreadsheet-like column index from theirs labels: A, B, C ...., Z, AA, AB, etc.
 *
 * @param {string} label Column label.
 * @returns {number}
 */
export function spreadsheetColumnIndex(label) {
  let result = 0;

  if (label) {
    for (let i = 0, j = label.length - 1; i < label.length; i += 1, j -= 1) {
      result += (COLUMN_LABEL_BASE_LENGTH ** j) * (COLUMN_LABEL_BASE.indexOf(label[i]) + 1);
    }
  }
  result -= 1;

  return result;
}

/**
 * Creates 2D array of Excel-like values "A1", "A2", ...
 *
 * @param {number} rows Number of rows to generate.
 * @param {number} columns Number of columns to generate.
 * @returns {Array}
 */
export function createSpreadsheetData(rows = 100, columns = 4) {
  const _rows = [];
  let i;
  let j;

  for (i = 0; i < rows; i++) {
    const row = [];

    for (j = 0; j < columns; j++) {
      row.push(spreadsheetColumnLabel(j) + (i + 1));
    }
    _rows.push(row);
  }

  return _rows;
}

/**
 * Creates 2D array of Excel-like values "A1", "A2", as an array of objects.
 *
 * @param {number} rows Number of rows to generate.
 * @param {number} colCount Number of columns to generate.
 * @returns {Array}
 */
export function createSpreadsheetObjectData(rows = 100, colCount = 4) {
  const _rows = [];
  let i;
  let j;

  for (i = 0; i < rows; i++) {
    const row = {};

    for (j = 0; j < colCount; j++) {
      row[`prop${j}`] = spreadsheetColumnLabel(j) + (i + 1);
    }
    _rows.push(row);
  }

  return _rows;
}

/**
 * Generates an empty data object.
 *
 * @param {number} rows Number of rows to generate.
 * @param {number} columns Number of columns to generate.
 * @returns {Array}
 */
export function createEmptySpreadsheetData(rows, columns) {
  const data = [];
  let row;

  for (let i = 0; i < rows; i++) {
    row = [];

    for (let j = 0; j < columns; j++) {
      row.push('');
    }
    data.push(row);
  }

  return data;
}

/**
 * Transform a data row (either an array or an object) or an array of data rows to array of changes in a form of `[row,
 * prop/col, value]`. Convenient to use with `setDataAtRowProp` and `setSourceDataAtCell` methods.
 *
 * @param {Array|object} dataRow Object of row data, array of row data or an array of either.
 * @param {number} rowOffset Row offset to be passed to the resulting change list. Defaults to `0`.
 * @returns {Array} Array of changes (in a form of an array).
 */
export function dataRowToChangesArray(dataRow, rowOffset = 0) {
  let dataRows = dataRow;
  const changesArray = [];

  if (!Array.isArray(dataRow) || !Array.isArray(dataRow[0])) {
    dataRows = [dataRow];
  }

  dataRows.forEach((row, rowIndex) => {
    if (Array.isArray(row)) {
      row.forEach((value, column) => {
        changesArray.push([
          rowIndex + rowOffset,
          column,
          value
        ]);
      });

    } else {
      Object.keys(row).forEach((propName) => {
        changesArray.push([
          rowIndex + rowOffset,
          propName,
          row[propName]
        ]);
      });
    }
  });

  return changesArray;
}

/**
 * Count the number of keys (or, basically, columns when the data is an array or arrays) in the first row of the
 * provided dataset.
 *
 * @param {Array} data The dataset.
 * @returns {number} Number of keys in the first row of the dataset.
 */
export function countFirstRowKeys(data) {
  let result = 0;

  if (Array.isArray(data)) {
    if (data[0] && Array.isArray(data[0])) {
      result = data[0].length;

    } else if (data[0] && isObject(data[0])) {
      result = deepObjectSize(data[0]);
    }
  }

  return result;
}

/**
 * Check whether the provided dataset is a *non-empty* array of arrays.
 *
 * @param {Array} data Dataset to be checked.
 * @returns {boolean} `true` if data is an array of arrays, `false` otherwise.
 */
export function isArrayOfArrays(data) {
  return !!(Array.isArray(data) && data.length && data.every(el => Array.isArray(el)));
}

/**
 * Check whether the provided dataset is a *non-empty* array of objects.
 *
 * @param {Array} data Dataset to be checked.
 * @returns {boolean} `true` if data is an array of objects, `false` otherwise.
 */
export function isArrayOfObjects(data) {
  return !!(Array.isArray(data) &&
    data.length &&
    data.every(el => typeof el === 'object' && !Array.isArray(el) && el !== null));
}
