import { getCompareFunctionFactory } from './sortService';

/**
 * Sort comparator handled by conventional sort algorithm.
 *
 * @param {Array} sortingOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMetas Column meta objects.
 * @returns {Function}
 */
export function rootComparator(sortingOrders: unknown[], columnMetas: unknown[]) {
  return function(rowIndexWithValues: unknown[], nextRowIndexWithValues: unknown[]) {
    // We sort array of arrays. Single array is in form [rowIndex, ...values].
    // We compare just values, stored at second index of array.
    const [, ...values] = rowIndexWithValues;
    const [, ...nextValues] = nextRowIndexWithValues;

    return (function getCompareResult(column): number {
      const sortingOrder = sortingOrders[column];
      const columnMeta = columnMetas[column];
      const value = values[column];
      const nextValue = nextValues[column];

      type CompareFn = (a: unknown, b: unknown) => number;
      type CompareFnFactory = (order: unknown, meta: unknown, settings: unknown) => CompareFn;
      const typedMeta = columnMeta as { columnSorting?: { compareFunctionFactory?: CompareFnFactory }; type?: string };
      const pluginSettings = typedMeta.columnSorting;
      const compareFunctionFactory: CompareFnFactory = pluginSettings?.compareFunctionFactory ?
        pluginSettings.compareFunctionFactory : getCompareFunctionFactory(typedMeta.type ?? '') as CompareFnFactory;
      const compareResult: number = compareFunctionFactory(sortingOrder, columnMeta, pluginSettings)(value, nextValue);

      // DIFF - MultiColumnSorting & ColumnSorting: removed iteration through next sorted columns.

      return compareResult;
    }(0));
  };
}
