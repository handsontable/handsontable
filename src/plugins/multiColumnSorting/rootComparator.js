/* eslint-disable import/prefer-default-export */

import { getCompareFunctionFactory, DO_NOT_SWAP } from 'handsontable/plugins/columnSorting/sortService';

/**
 * Sort comparator handled by conventional sort algorithm.
 *
 * @param {Array} sortOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMetas Column meta objects.
 * @returns {Function}
 */
export function rootComparator(sortingOrders, columnMetas) {
  return function(rowIndexWithValues, nextRowIndexWithValues) {
    // We sort array of arrays. Single array is in form [rowIndex, ...values].
    // We compare just values, stored at second index of array.
    const [, ...values] = rowIndexWithValues;
    const [, ...nextValues] = nextRowIndexWithValues;

    return (function getCompareResult(column) {
      const sortingOrder = sortingOrders[column];
      const columnMeta = columnMetas[column];
      const value = values[column];
      const nextValue = nextValues[column];
      const pluginSettings = columnMeta.multiColumnSorting;
      const compareFunctionFactory = pluginSettings.compareFunctionFactory ? pluginSettings.compareFunctionFactory : getCompareFunctionFactory(columnMeta.type);
      const compareResult = compareFunctionFactory(sortingOrder, columnMeta, pluginSettings)(value, nextValue);

      if (compareResult === DO_NOT_SWAP) {
        const nextSortedColumn = column + 1;

        if (typeof columnMetas[nextSortedColumn] !== 'undefined') {
          return getCompareResult(nextSortedColumn);
        }
      }

      return compareResult;
    }(0));
  };
}
