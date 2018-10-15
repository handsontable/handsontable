'use strict';

exports.__esModule = true;
exports.spreadsheetColumnLabel = spreadsheetColumnLabel;
exports.spreadsheetColumnIndex = spreadsheetColumnIndex;
exports.createSpreadsheetData = createSpreadsheetData;
exports.createSpreadsheetObjectData = createSpreadsheetObjectData;
exports.createEmptySpreadsheetData = createEmptySpreadsheetData;
exports.translateRowsToColumns = translateRowsToColumns;
exports.cellMethodLookupFactory = cellMethodLookupFactory;

var _cellTypes = require('./../cellTypes');

var _object = require('./object');

var COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc.
 *
 * @param {Number} index Column index.
 * @returns {String}
 */
function spreadsheetColumnLabel(index) {
  var dividend = index + 1;
  var columnLabel = '';
  var modulo = void 0;

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
function spreadsheetColumnIndex(label) {
  var result = 0;

  if (label) {
    for (var i = 0, j = label.length - 1; i < label.length; i += 1, j -= 1) {
      result += Math.pow(COLUMN_LABEL_BASE_LENGTH, j) * (COLUMN_LABEL_BASE.indexOf(label[i]) + 1);
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
function createSpreadsheetData() {
  var rows = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
  var columns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

  var _rows = [];
  var i = void 0;
  var j = void 0;

  for (i = 0; i < rows; i++) {
    var row = [];

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
function createSpreadsheetObjectData() {
  var rows = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
  var colCount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

  var _rows = [];
  var i = void 0;
  var j = void 0;

  for (i = 0; i < rows; i++) {
    var row = {};

    for (j = 0; j < colCount; j++) {
      row['prop' + j] = spreadsheetColumnLabel(j) + (i + 1);
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
function createEmptySpreadsheetData(rows, columns) {
  var data = [];
  var row = void 0;

  for (var i = 0; i < rows; i++) {
    row = [];
    for (var j = 0; j < columns; j++) {
      row.push('');
    }
    data.push(row);
  }

  return data;
}

function translateRowsToColumns(input) {
  var output = [];
  var i = void 0;
  var ilen = void 0;
  var j = void 0;
  var jlen = void 0;
  var olen = 0;

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
function cellMethodLookupFactory(methodName, allowUndefined) {
  var isUndefinedAllowed = typeof allowUndefined === 'undefined' ? true : allowUndefined;

  return function cellMethodLookup(row, col) {
    return function getMethodFromProperties(properties) {

      if (!properties) {
        return; // method not found
      } else if ((0, _object.hasOwnProperty)(properties, methodName) && properties[methodName] !== void 0) {
        // check if it is own and is not empty
        return properties[methodName]; // method defined directly
      } else if ((0, _object.hasOwnProperty)(properties, 'type') && properties.type) {
        // check if it is own and is not empty
        if (typeof properties.type !== 'string') {
          throw new Error('Cell type must be a string ');
        }

        var type = (0, _cellTypes.getCellType)(properties.type);

        if ((0, _object.hasOwnProperty)(type, methodName)) {
          return type[methodName]; // method defined in type.
        } else if (isUndefinedAllowed) {
          return; // method does not defined in type (eg. validator), returns undefined
        }
      }

      return getMethodFromProperties(Object.getPrototypeOf(properties));
    }(typeof row === 'number' ? this.getCellMeta(row, col) : row);
  };
}