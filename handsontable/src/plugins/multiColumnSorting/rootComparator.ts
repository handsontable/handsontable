import { getCompareFunctionFactory } from '../columnSorting/sortService/registry';
import { DO_NOT_SWAP } from '../columnSorting/sortService/engine';
import { isPreparedCompareFn, withPreparedKeys } from '../columnSorting/sortService/preparedComparator';

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
export function createColumnCompareFunction(sortingOrder: string, columnMeta: Record<string, unknown>): CompareFn {
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

  // The comparator handed back is the raw, per-comparison one. `withPreparedKeys` only adds the
  // `prepare`/`cleanup` seam next to it, which `sortService/engine.ts` uses when at least one
  // compare function extracts its keys in one pass; calling the comparator directly keeps working.
  return withPreparedKeys((rowIndexWithValues: unknown[], nextRowIndexWithValues: unknown[]) => {
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
  }, compareFunctions);
}

/**
 * Sort comparator over parallel value arrays - the equivalent of `rootComparator()` for the sort of
 * a plain positions array.
 *
 * `sortByPresetSortStates()` takes this path when the root comparator registered under the plugin's
 * key is still the built-in one, so it must stay behaviorally identical to `rootComparator()`: one
 * compare function per sorted column, created once per sort run, and the same tie-break walk. The
 * k-th column's values live in `columnValues[k]` instead of at index `k + 1` of each tuple.
 *
 * @param {Array} sortingOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMetas Column meta objects.
 * @param {Array} columnValues One array of cell values per sorted column, indexed by position.
 * @returns {Function}
 */
export function positionComparator(
  sortingOrders: string[], columnMetas: Record<string, unknown>[], columnValues: unknown[][]
) {
  const compareFunctions = columnMetas.map(
    (columnMeta, column) => createColumnCompareFunction(sortingOrders[column], columnMeta));
  const columnCount = compareFunctions.length;
  // Resolved per column, exactly as `withPreparedKeys()` resolves it on the tuple path: a column
  // whose compare function extracts its keys in one pass reads them by position, a column with a
  // user-supplied compare function keeps the pairwise path, in the same sort. A position already
  // *is* the row's index into a key store, so no row decoration is involved.
  const keyStores: unknown[] = [];
  const keyCompareFns: (((keys: unknown, index: number, nextIndex: number) => number) | null)[] = [];

  for (let column = 0; column < columnCount; column += 1) {
    const compareFunction = compareFunctions[column];

    if (isPreparedCompareFn(compareFunction)) {
      keyStores.push(compareFunction.prepareValues(columnValues[column]));
      keyCompareFns.push(compareFunction.compare);

    } else {
      keyStores.push(null);
      keyCompareFns.push(null);
    }
  }

  return function(position: number, nextPosition: number) {
    for (let column = 0; column < columnCount; column += 1) {
      const keyCompareFn = keyCompareFns[column];
      let compareResult;

      if (keyCompareFn === null) {
        const values = columnValues[column];

        compareResult = compareFunctions[column](values[position], values[nextPosition]);

      } else {
        compareResult = keyCompareFn(keyStores[column], position, nextPosition);
      }

      if (compareResult !== DO_NOT_SWAP) {
        return compareResult;
      }
    }

    return DO_NOT_SWAP;
  };
}
