'use strict';

exports.__esModule = true;
exports.FIRST_AFTER_SECOND = exports.FIRST_BEFORE_SECOND = exports.DO_NOT_SWAP = undefined;
exports.mainSortComparator = mainSortComparator;

var _date = require('./sortFunction/date');

var _date2 = _interopRequireDefault(_date);

var _default = require('./sortFunction/default');

var _default2 = _interopRequireDefault(_default);

var _numeric = require('./sortFunction/numeric');

var _numeric2 = _interopRequireDefault(_numeric);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var DO_NOT_SWAP = exports.DO_NOT_SWAP = 0;
var FIRST_BEFORE_SECOND = exports.FIRST_BEFORE_SECOND = -1;
var FIRST_AFTER_SECOND = exports.FIRST_AFTER_SECOND = 1;

/**
 * Gets sort function for the particular column basing on its column meta.
 *
 * @param {Array} columnMeta Column meta object.
 * @returns {Function}
 */
function getCompareFunctionFactory(columnMeta) {
  var columnSettings = columnMeta.columnSorting;

  if (columnSettings.compareFunctionFactory) {
    return columnSettings.compareFunctionFactory;
  } else if (columnMeta.type === 'date') {
    return _date2.default;
  } else if (columnMeta.type === 'numeric') {
    return _numeric2.default;
  }

  return _default2.default;
}

/**
 * Sort comparator handled by conventional sort algorithm.
 *
 * @param {Array} sortOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMeta Column meta objects.
 * @returns {Function}
 */
function mainSortComparator(sortingOrders, columnMetas) {
  return function (rowIndexWithValues, nextRowIndexWithValues) {
    // We sort array of arrays. Single array is in form [rowIndex, ...values].
    // We compare just values, stored at second index of array.
    var _rowIndexWithValues = _toArray(rowIndexWithValues),
        values = _rowIndexWithValues.slice(1);

    var _nextRowIndexWithValu = _toArray(nextRowIndexWithValues),
        nextValues = _nextRowIndexWithValu.slice(1);

    return function getCompareResult(column) {
      var sortingOrder = sortingOrders[column];
      var columnMeta = columnMetas[column];
      var value = values[column];
      var nextValue = nextValues[column];
      var compareFunctionFactory = getCompareFunctionFactory(columnMeta);
      var compareResult = compareFunctionFactory(sortingOrder, columnMeta)(value, nextValue);

      // DIFF - MultiColumnSorting & ColumnSorting: removed iteration through next sorted columns.

      return compareResult;
    }(0);
  };
}