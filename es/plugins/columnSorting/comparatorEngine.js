function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

import dateSort from './sortFunction/date';
import defaultSort from './sortFunction/default';
import numericSort from './sortFunction/numeric';

export var DO_NOT_SWAP = 0;
export var FIRST_BEFORE_SECOND = -1;
export var FIRST_AFTER_SECOND = 1;

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
    return dateSort;
  } else if (columnMeta.type === 'numeric') {
    return numericSort;
  }

  return defaultSort;
}

/**
 * Sort comparator handled by conventional sort algorithm.
 *
 * @param {Array} sortOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMeta Column meta objects.
 * @returns {Function}
 */
export function mainSortComparator(sortingOrders, columnMetas) {
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