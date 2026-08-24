import { getCompareFunctionFactory } from './sortService';

type CompareFn = (a: unknown, b: unknown) => number;
type CompareFnFactory = (order: unknown, meta: unknown, settings: unknown) => CompareFn;

/**
 * Creates the compare function for a single sorted column. Resolved once per sort run — the
 * factory result is reused for every comparison, so any per-run caching inside the returned
 * compare function (e.g. normalized-value memoization) stays effective.
 *
 * @param {unknown} sortingOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {unknown} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
function createColumnCompareFunction(sortingOrder: unknown, columnMeta: unknown): CompareFn {
  const typedMeta = columnMeta as { columnSorting?: { compareFunctionFactory?: CompareFnFactory }; type?: string };
  const pluginSettings = typedMeta.columnSorting;
  const compareFunctionFactory: CompareFnFactory = pluginSettings?.compareFunctionFactory ?
    pluginSettings.compareFunctionFactory : getCompareFunctionFactory(typedMeta.type ?? '') as CompareFnFactory;

  return compareFunctionFactory(sortingOrder, columnMeta, pluginSettings);
}

/**
 * Sort comparator handled by conventional sort algorithm.
 *
 * @param {Array} sortingOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMetas Column meta objects.
 * @returns {Function}
 */
export function rootComparator(sortingOrders: unknown[], columnMetas: unknown[]) {
  // The compare function is created once per sort run, not once per comparison. Re-invoking the
  // factory inside the comparator would allocate a fresh closure ~n*log(n) times and defeat the
  // per-run value caches the built-in compare functions rely on.
  const compareFunction = createColumnCompareFunction(sortingOrders[0], columnMetas[0]);

  return function(rowIndexWithValues: unknown[], nextRowIndexWithValues: unknown[]) {
    // We sort array of arrays. Single array is in form [rowIndex, ...values],
    // so the value of the only sorted column is stored at index 1.
    return compareFunction(rowIndexWithValues[1], nextRowIndexWithValues[1]);
  };
}
