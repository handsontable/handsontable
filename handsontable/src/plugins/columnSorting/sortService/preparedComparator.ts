import { DO_NOT_SWAP } from './engine';

/**
 * Marks a compare function that implements the seam. Module-private and never exported, so a
 * compare function that arrives from user code cannot carry it: the fast path is opted into by the
 * built-in factory alone, and the `prepare`, `prepareValues` and `compare` property names stay free
 * for anyone else to use for their own purposes.
 */
const PREPARED_COMPARE_FN = Symbol('preparedCompareFn');

/**
 * Marks a root comparator that carries the seam. A separate marker from the one above: a root
 * comparator and a compare function answer different calls, so one marker would let a compare
 * function reach `sortService/engine.ts` as if it were a root comparator.
 */
const PREPARING_ROOT_COMPARATOR = Symbol('preparingRootComparator');

/**
 * The seam markers, as the property bag they are read from.
 */
interface SeamMarkers {
  [PREPARED_COMPARE_FN]?: true;
  [PREPARING_ROOT_COMPARATOR]?: true;
}

/**
 * A compare function returned by a compare function factory. It is always callable with two raw
 * cell values, which is the only shape a user-supplied factory has to provide.
 */
export type CompareFn = (value: unknown, nextValue: unknown) => number;

/**
 * The optional decorate-sort-undecorate seam a compare function may expose on top of being
 * callable.
 *
 * `prepare()` extracts every row's comparison key in one pass and returns an opaque, columnar key
 * store. `compare()` then answers a comparison from two key-store indexes, without touching the
 * raw values again. Both are properties on the callable compare function, so a compare function
 * that opts in stays byte-for-byte usable by every caller that only invokes it pairwise (for
 * example `sortFunction/checkbox.ts`, which falls back to the default compare function for
 * non-template values).
 *
 * @template K The shape of the key store, private to the compare function that produced it.
 */
export interface PreparedCompareFn<K = unknown> extends CompareFn {

  /**
   * Extracts the comparison keys of every sorted row for one column.
   *
   * @param {Array} rows The rows being sorted, each one a `[rowIndex, ...values]` array.
   * @param {number} valueIndex The slot this column's value sits at inside a row array.
   * @returns {*} The key store, indexed by the row's position in `rows`.
   */
  prepare(rows: unknown[][], valueIndex: number): K;

  /**
   * Extracts the comparison keys of every sorted row for one column, from that column's values
   * read out on their own. This is the entry point the positions sort path uses: the position of
   * a row already *is* its index into the key store, so no row array and no value slot are
   * involved.
   *
   * @param {Array} values The column's cell values, indexed by position.
   * @returns {*} The key store, indexed by the same position.
   */
  prepareValues(values: unknown[]): K;

  /**
   * Compares two rows by their extracted keys.
   *
   * @param {*} keys The key store returned by `prepare()`.
   * @param {number} index The first row's position in the prepared `rows`.
   * @param {number} nextIndex The second row's position in the prepared `rows`.
   * @returns {number} The comparison result.
   */
  compare(keys: K, index: number, nextIndex: number): number;
}

/**
 * A root comparator that knows how to decorate the sorted rows with their comparison keys.
 */
export interface PreparingRootCompareFn {
  (row: unknown[], nextRow: unknown[]): number;

  /**
   * Extracts the keys of every sorted row and decorates the rows with an index into the key
   * stores. Returns the comparator to sort with, or `null` when there is nothing to prepare.
   *
   * @param {Array} rows The rows being sorted.
   * @returns {Function | null} The key-reading comparator, or `null`.
   */
  prepare(rows: unknown[][]): ((row: unknown[], nextRow: unknown[]) => number) | null;

  /**
   * Removes the decoration added by `prepare()`, restoring the documented row shape.
   *
   * @param {Array} rows The rows that were sorted.
   */
  cleanup(rows: unknown[][]): void;
}

/**
 * Declares a compare function as implementing the decorate-sort-undecorate seam.
 *
 * Only a built-in compare function factory calls this. The marker is a module-private `Symbol`
 * rather than the presence of the three methods: `createColumnCompareFunction()` hands the
 * comparator whatever a `compareFunctionFactory` returns, so a probe on property names would let
 * user code route itself down the prepared path - silently sorting by keys that function never
 * produced.
 *
 * @param {Function} compareFunction The compare function that carries `prepare`, `prepareValues`
 *   and `compare`.
 * @returns {Function} The same compare function, marked.
 */
export function markPreparedCompareFn<K>(compareFunction: PreparedCompareFn<K>): PreparedCompareFn<K> {
  (compareFunction as SeamMarkers)[PREPARED_COMPARE_FN] = true;

  return compareFunction;
}

/**
 * Checks whether a compare function implements the decorate-sort-undecorate seam.
 *
 * @param {Function} compareFunction The compare function to check.
 * @returns {boolean}
 */
export function isPreparedCompareFn(compareFunction: CompareFn): compareFunction is PreparedCompareFn {
  return (compareFunction as SeamMarkers | undefined | null)?.[PREPARED_COMPARE_FN] === true;
}

/**
 * Checks whether a root comparator implements the decorate-sort-undecorate seam.
 *
 * Takes `unknown` on purpose: a root comparator factory is arbitrary registered code and may
 * return anything, including nothing at all.
 *
 * @param {*} comparator The value a root comparator factory returned.
 * @returns {boolean}
 */
export function isPreparingRootCompareFn(comparator: unknown): comparator is PreparingRootCompareFn {
  return (comparator as SeamMarkers | undefined | null)?.[PREPARING_ROOT_COMPARATOR] === true;
}

/**
 * Adds the decorate-sort-undecorate seam to a root comparator when at least one of its per-column
 * compare functions implements it.
 *
 * The raw comparator is returned unchanged, so callers that sort without calling `prepare()` first
 * — and every user-supplied compare function, which never exposes the seam — keep the exact
 * per-comparison path they have today.
 *
 * The decoration is a single numeric slot appended at the end of every row array. It is appended,
 * never inserted, so the documented `[rowIndex, ...values]` shape stays true for slots `0..k`
 * while the sort runs, and `cleanup()` pops it afterwards.
 *
 * @param {Function} rootCompareFn The comparator that compares two rows by their raw values.
 * @param {Array} compareFunctions The per-column compare functions, in sorted-column order.
 * @returns {Function} The comparator, with the seam attached when it can be used.
 */
export function withPreparedKeys(
  rootCompareFn: (row: unknown[], nextRow: unknown[]) => number, compareFunctions: CompareFn[]
): (row: unknown[], nextRow: unknown[]) => number {
  if (!compareFunctions.some(isPreparedCompareFn)) {
    return rootCompareFn;
  }

  const columnCount = compareFunctions.length;
  const preparingRootCompareFn = rootCompareFn as PreparingRootCompareFn;

  preparingRootCompareFn.prepare = (rows) => {
    const rowCount = rows.length;

    if (rowCount === 0) {
      return null;
    }

    // Every row the gather loop emits has the same length, so one slot index serves them all.
    const keySlot = rows[0].length;
    const keyStores: unknown[] = [];
    const keyCompareFns: (PreparedCompareFn['compare'] | null)[] = [];

    for (let column = 0; column < columnCount; column++) {
      const compareFunction = compareFunctions[column];

      if (isPreparedCompareFn(compareFunction)) {
        keyStores.push(compareFunction.prepare(rows, column + 1));
        keyCompareFns.push(compareFunction.compare);

      } else {
        keyStores.push(null);
        keyCompareFns.push(null);
      }
    }

    for (let row = 0; row < rowCount; row++) {
      rows[row].push(row);
    }

    return function(row: unknown[], nextRow: unknown[]) {
      const index = row[keySlot] as number;
      const nextIndex = nextRow[keySlot] as number;

      for (let column = 0; column < columnCount; column++) {
        const keyCompareFn = keyCompareFns[column];
        const compareResult = keyCompareFn === null ?
          compareFunctions[column](row[column + 1], nextRow[column + 1]) :
          keyCompareFn(keyStores[column], index, nextIndex);

        if (compareResult !== DO_NOT_SWAP) {
          return compareResult;
        }
      }

      return DO_NOT_SWAP;
    };
  };

  preparingRootCompareFn.cleanup = (rows) => {
    for (let row = 0; row < rows.length; row++) {
      rows[row].pop();
    }
  };

  (preparingRootCompareFn as SeamMarkers)[PREPARING_ROOT_COMPARATOR] = true;

  return preparingRootCompareFn;
}
