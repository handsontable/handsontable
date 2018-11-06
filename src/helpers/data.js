import { getCellType } from './../cellTypes';
import { hasOwnProperty } from './object';

const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc.
 *
 * @param {Number} index Column index.
 * @returns {String}
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
 * @param {String} label Column label.
 * @returns {Number}
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
 * @param {Number} rows Number of rows to generate.
 * @param {Number} columns Number of columns to generate.
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
 * @param {Number} rows Number of rows to generate.
 * @param {Number} colCount Number of columns to generate.
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
 * @param {Number} rows Number of rows to generate.
 * @param {Number} columns Number of columns to generate
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

export function translateRowsToColumns(input) {
  const output = [];
  let i;
  let ilen;
  let j;
  let jlen;
  let olen = 0;

  for (i = 0, ilen = input.length; i < ilen; i++) {
    for (j = 0, jlen = input[i].length; j < jlen; j++) {
      if (j === olen) {
        output.push([]);
        olen += 1;
      }
      output[j].push(input[i][j]);
    }
  }

  return output;
}

/**
 * Factory that produces a function for searching methods (or any properties) which could be defined directly in
 * table configuration or implicitly, within cell type definition.
 *
 * For example: renderer can be defined explicitly using "renderer" property in column configuration or it can be
 * defined implicitly using "type" property.
 *
 * Methods/properties defined explicitly always takes precedence over those defined through "type".
 *
 * If the method/property is not found in an object, searching is continued recursively through prototype chain, until
 * it reaches the Object.prototype.
 *
 *
 * @param methodName {String} name of the method/property to search (i.e. 'renderer', 'validator', 'copyable')
 * @param allowUndefined {Boolean} [optional] if false, the search is continued if methodName has not been found in cell "type"
 * @returns {Function}
 */
export function cellMethodLookupFactory(methodName, allowUndefined) {
  const isUndefinedAllowed = typeof allowUndefined === 'undefined' ? true : allowUndefined;

  return function cellMethodLookup(row, col) {
    return (function getMethodFromProperties(properties) {

      if (!properties) {
        return; // method not found

      } else if (hasOwnProperty(properties, methodName) && properties[methodName] !== void 0) { // check if it is own and is not empty
        return properties[methodName]; // method defined directly

      } else if (hasOwnProperty(properties, 'type') && properties.type) { // check if it is own and is not empty
        if (typeof properties.type !== 'string') {
          throw new Error('Cell type must be a string ');
        }

        const type = getCellType(properties.type);

        if (hasOwnProperty(type, methodName)) {
          return type[methodName]; // method defined in type.
        } else if (isUndefinedAllowed) {
          return; // method does not defined in type (eg. validator), returns undefined
        }
      }

      return getMethodFromProperties(Object.getPrototypeOf(properties));

    }(typeof row === 'number' ? this.getCellMeta(row, col) : row));
  };
}
