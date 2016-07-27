import Handsontable from './../browser';
import {getPrototypeOf} from './object';

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc
 * @param index
 * @returns {String}
 */
export function spreadsheetColumnLabel(index) {
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26, 10);
  }
  return columnLabel;
}

/**
 * Creates 2D array of Excel-like values "A1", "A2", ...
 * @param rowCount
 * @param colCount
 * @returns {Array}
 */
export function createSpreadsheetData(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = [], i, j;

  for (i = 0; i < rowCount; i++) {
    var row = [];

    for (j = 0; j < colCount; j++) {
      row.push(spreadsheetColumnLabel(j) + (i + 1));
    }
    rows.push(row);
  }

  return rows;
}

export function createSpreadsheetObjectData(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = [], i, j;

  for (i = 0; i < rowCount; i++) {
    var row = {};

    for (j = 0; j < colCount; j++) {
      row['prop' + j] = spreadsheetColumnLabel(j) + (i + 1);
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Generates an empty data object.
 *
 * @param {Number} rows Number of rows to generate.
 * @param {Number} columns Number of columns to generate
 * @returns {Array}
 */
export function createEmptySpreadsheetData(rows, columns) {
  let data = [];
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
  var i, ilen, j, jlen, output = [], olen = 0;

  for (i = 0, ilen = input.length; i < ilen; i++) {
    for (j = 0, jlen = input[i].length; j < jlen; j++) {
      if (j == olen) {
        output.push([]);
        olen++;
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

  allowUndefined = typeof allowUndefined == 'undefined' ? true : allowUndefined;

  return function cellMethodLookup(row, col) {
    return (function getMethodFromProperties(properties) {

      if (!properties) {
        return; // method not found

      } else if (properties.hasOwnProperty(methodName) && properties[methodName] !== void 0) { //check if it is own and is not empty
        return properties[methodName];  //method defined directly

      } else if (properties.hasOwnProperty('type') && properties.type) { //check if it is own and is not empty
        var type;

        if (typeof properties.type != 'string') {
          throw new Error('Cell type must be a string ');
        }
        type = translateTypeNameToObject(properties.type);

        if (type.hasOwnProperty(methodName)) {
          return type[methodName]; //method defined in type.
        } else if (allowUndefined) {
          return; //method does not defined in type (eg. validator), returns undefined
        }
      }

      return getMethodFromProperties(getPrototypeOf(properties));

    })(typeof row == 'number' ? this.getCellMeta(row, col) : row);
  };

  function translateTypeNameToObject(typeName) {
    var type = Handsontable.cellTypes[typeName];

    if (typeof type == 'undefined') {
      throw new Error('You declared cell type "' + typeName + '" as a string that is not mapped to a known object. ' +
        'Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
    }

    return type;
  }
}
