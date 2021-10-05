import { getCompareFunctionFactory } from './sortService';

/**
 * Sort comparator handled by conventional sort algorithm.
 *
 * @param {Array} sortingOrders Sort orders (`asc` for ascending, `desc` for descending).
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
      const pluginSettings = columnMeta.columnSorting;
      const compareFunctionFactory = pluginSettings.compareFunctionFactory ?
        pluginSettings.compareFunctionFactory : getCompareFunctionFactory(columnMeta.type);
      const compareResult = compareFunctionFactory(sortingOrder, columnMeta, pluginSettings)(value, nextValue);

      // DIFF - MultiColumnSorting & ColumnSorting: removed iteration through next sorted columns.

      return compareResult;
    }(0));
  };
}
