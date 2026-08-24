import { getCompareFunctionFactory } from '../columnSorting/sortService/registry';
import { DO_NOT_SWAP } from '../columnSorting/sortService/engine';

type CompareFn = (a: unknown, b: unknown) => number;
type CompareFnFactory = (order: unknown, meta: unknown, settings: unknown) => CompareFn;

/**
 * Creates the compare function for a single sorted column. Resolved once per sort run — the
 * factory result is reused for every comparison, so any per-run caching inside the returned
 * compare function (e.g. normalized-value memoization) stays effective.
 *
 * @param {string} sortingOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
function createColumnCompareFunction(sortingOrder: string, columnMeta: Record<string, unknown>): CompareFn {
  const pluginSettings = columnMeta.multiColumnSorting as { compareFunctionFactory?: CompareFnFactory };
  const compareFunctionFactory: CompareFnFactory = pluginSettings.compareFunctionFactory ?
    pluginSettings.compareFunctionFactory : getCompareFunctionFactory(columnMeta.type as string) as CompareFnFactory;

  return compareFunctionFactory(sortingOrder, columnMeta, pluginSettings);
}

/**
 * Sort comparator handled by conventional sort algorithm.
 *
 * @param {Array} sortingOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMetas Column meta objects.
 * @returns {Function}
 */
export function rootComparator(sortingOrders: string[], columnMetas: Record<string, unknown>[]) {
  // One compare function per sorted column, created once per sort run, not once per comparison.
  // Re-invoking the factories inside the comparator would allocate fresh closures ~n*log(n) times
  // and defeat the per-run value caches the built-in compare functions rely on.
  const compareFunctions = columnMetas.map(
    (columnMeta, column) => createColumnCompareFunction(sortingOrders[column], columnMeta));

  return function(rowIndexWithValues: unknown[], nextRowIndexWithValues: unknown[]) {
    // We sort array of arrays. Single array is in form [rowIndex, ...values],
    // so the value of sorted column N is stored at index N + 1. Columns after the first act as
    // tie-breakers: they are consulted only while the previous columns compare as equal.
    for (let column = 0; column < compareFunctions.length; column += 1) {
      const compareResult = compareFunctions[column](
        rowIndexWithValues[column + 1], nextRowIndexWithValues[column + 1]);

      if (compareResult !== DO_NOT_SWAP) {
        return compareResult;
      }
    }

    return DO_NOT_SWAP;
  };
}
