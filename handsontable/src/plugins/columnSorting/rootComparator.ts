import { getCompareFunctionFactory } from './sortService';
import { isPreparedCompareFn, withPreparedKeys } from './sortService/preparedComparator';

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

  // The comparator handed back is the raw, per-comparison one. `withPreparedKeys` only adds the
  // `prepare`/`cleanup` seam next to it, which `sortService/engine.ts` uses when the compare
  // function extracts its keys in one pass; calling the comparator directly keeps working.
  return withPreparedKeys((rowIndexWithValues: unknown[], nextRowIndexWithValues: unknown[]) => {
    // We sort array of arrays. Single array is in form [rowIndex, ...values],
    // so the value of the only sorted column is stored at index 1.
    return compareFunction(rowIndexWithValues[1], nextRowIndexWithValues[1]);
  }, [compareFunction]);
}

/**
 * Sort comparator over parallel value arrays - the equivalent of `rootComparator()` for the sort of
 * a plain positions array.
 *
 * `sortByPresetSortStates()` takes this path when the root comparator registered under the plugin's
 * key is still the built-in one, so it must stay behaviorally identical to `rootComparator()`: the
 * same compare function, created once per sort run, reading the same value.
 *
 * @param {Array} sortingOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMetas Column meta objects.
 * @param {Array} columnValues One array of cell values per sorted column, indexed by position.
 * @returns {Function}
 */
export function positionComparator(sortingOrders: unknown[], columnMetas: unknown[], columnValues: unknown[][]) {
  const compareFunction = createColumnCompareFunction(sortingOrders[0], columnMetas[0]);
  // The only sorted column's values. In the tuple form this is what sits at index 1 of each row.
  const values = columnValues[0];

  // The same decorate-sort-undecorate seam `sortService/engine.ts` uses on the tuple path, minus
  // the decoration: a position already *is* the row's index into the key store, so the keys are
  // extracted straight from the value array and nothing has to be appended to, or popped off, a
  // row. A user-supplied compare function never exposes the seam and keeps the pairwise path.
  if (isPreparedCompareFn(compareFunction)) {
    const keys = compareFunction.prepareValues(values);
    const compare = compareFunction.compare;

    return function(position: number, nextPosition: number) {
      return compare(keys, position, nextPosition);
    };
  }

  return function(position: number, nextPosition: number) {
    return compareFunction(values[position], values[nextPosition]);
  };
}
