// Imported through the barrel, exactly as `columnSorting.ts` does. Reaching for
// `sortService/engine` first would initialize the module cycle in the opposite order and leave
// `sortFunction/default.ts`'s imported sort-result constants undefined.
import { sort, registerRootComparator } from 'handsontable/plugins/columnSorting/sortService';
import { rootComparator } from 'handsontable/plugins/columnSorting/rootComparator';
import {
  markPreparedCompareFn,
} from 'handsontable/plugins/columnSorting/sortService/preparedComparator';
import type {
  PreparedCompareFn,
  PreparingRootCompareFn,
} from 'handsontable/plugins/columnSorting/sortService/preparedComparator';
import { compareFunctionFactory as defaultSort } from 'handsontable/plugins/columnSorting/sortFunction/default';

type CompareFn = (value: unknown, nextValue: unknown) => number;

const PREPARED_ID = 'test.columnSorting.prepared';
const PAIRWISE_ID = 'test.columnSorting.pairwise';

// The same per-column compare function, reached through a root comparator that never exposes the
// decorate-sort-undecorate seam — the shape every custom root comparator has.
registerRootComparator(PAIRWISE_ID, (sortingOrders: string[], columnMetas: Record<string, unknown>[]) => {
  const compareFunction = defaultSort(
    sortingOrders[0], columnMetas[0], columnMetas[0].columnSorting as Record<string, unknown>
  ) as CompareFn;

  return (row: unknown[], nextRow: unknown[]) => compareFunction(row[1], nextRow[1]);
});
registerRootComparator(PREPARED_ID, rootComparator);

describe('columnSorting prepared comparator', () => {
  const MIXED_POOL: unknown[] = [
    'Delta', 'delta', 'alpha', 'A100', 'a10', 'A1', '3', '10', '2.5', ' ',
    '', null, undefined, true, false, 0, 1, -5, 2.5, NaN, new Date(2020, 0, 1),
  ];

  /**
   * Builds the sorted-row arrays the engine sorts.
   *
   * @param {Array} pool The values to wrap.
   * @returns {Array} The `[rowIndex, value]` rows.
   */
  function toRows(pool: unknown[]): unknown[][] {
    return pool.map((value, rowIndex) => [rowIndex, value]);
  }

  /**
   * Sorts the pool through the engine and returns the resulting row-index order.
   *
   * @param {string} comparatorId The registered root comparator to sort with.
   * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
   * @param {object} pluginSettings Plugin settings for the column.
   * @returns {Array} The sorted rows.
   */
  function sortPool(comparatorId: string, sortOrder: string, pluginSettings: object): unknown[][] {
    const rows = toRows(MIXED_POOL);

    sort(rows, comparatorId, [sortOrder], [{ columnSorting: pluginSettings }]);

    return rows;
  }

  it('should produce the same order as the per-comparison path, stability included', () => {
    (['asc', 'desc'] as const).forEach((sortOrder) => {
      ([{}, { sortEmptyCells: true }, { sortEmptyCells: false }] as const).forEach((pluginSettings) => {
        const prepared = sortPool(PREPARED_ID, sortOrder, pluginSettings).map(row => row[0]);
        const pairwise = sortPool(PAIRWISE_ID, sortOrder, pluginSettings).map(row => row[0]);

        expect(prepared).toEqual(pairwise);
      });
    });
  });

  it('should leave the sorted rows in the documented `[rowIndex, ...values]` shape', () => {
    const rows = sortPool(PREPARED_ID, 'asc', {});

    expect(rows.every(row => row.length === 2)).toBe(true);
  });

  it('should never decorate the rows handed to a root comparator without the seam', () => {
    const seen: number[] = [];

    registerRootComparator('test.columnSorting.lengthProbe', () => {
      return (row: unknown[], nextRow: unknown[]) => {
        seen.push(row.length, nextRow.length);

        return 0;
      };
    });

    const rows = toRows(['b', 'a', 'c']);

    sort(rows, 'test.columnSorting.lengthProbe', ['asc'], [{ columnSorting: {} }]);

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(length => length === 2)).toBe(true);
    expect(rows.every(row => row.length === 2)).toBe(true);
  });

  it('should not throw when the sorted band is empty', () => {
    const rows: unknown[][] = [];

    expect(() => sort(rows, PREPARED_ID, ['asc'], [{ columnSorting: {} }])).not.toThrow();
    expect(rows).toEqual([]);
  });

  it('should keep working when a custom compare function factory is supplied', () => {
    const compareSpy = jest.fn((value: number, nextValue: number) => {
      if (value === nextValue) {
        return 0;
      }

      return value < nextValue ? -1 : 1;
    });
    const rows: unknown[][] = [[0, 3], [1, 1], [2, 2]];

    sort(rows, PREPARED_ID, ['asc'], [{ columnSorting: { compareFunctionFactory: () => compareSpy } }]);

    expect(rows.map(row => row[0])).toEqual([1, 2, 0]);
    expect(rows.every(row => row.length === 2)).toBe(true);
  });
});

describe('columnSorting prepared comparator seam', () => {
  it('should carry the decorate-sort-undecorate seam and append exactly one key slot', () => {
    const comparator = rootComparator(['asc'], [{ columnSorting: {} }]) as PreparingRootCompareFn;

    expect(typeof comparator.prepare).toBe('function');
    expect(typeof comparator.cleanup).toBe('function');

    const rows: unknown[][] = [[0, 'b'], [1, 'a']];
    const keyComparator = comparator.prepare(rows);

    expect(keyComparator).not.toBeNull();
    // One numeric slot appended at the end, so the documented value slots never move.
    expect(rows).toEqual([[0, 'b', 0], [1, 'a', 1]]);
    expect(keyComparator!(rows[0], rows[1])).toBe(1);

    comparator.cleanup(rows);

    expect(rows).toEqual([[0, 'b'], [1, 'a']]);
  });

  it('should not carry the seam when the column uses a user-supplied compare function', () => {
    const columnMeta = { columnSorting: { compareFunctionFactory: () => () => 0 } };
    const comparator = rootComparator(['asc'], [columnMeta]) as Partial<PreparingRootCompareFn>;

    expect(comparator.prepare).toBeUndefined();
  });
});

describe('columnSorting engine engagement', () => {
  it('should extract the keys once through `sort()` and never call the compare function pairwise', () => {
    // The built-in compare function, wrapped so every entry point can be counted. `markPreparedCompareFn`
    // is what makes it eligible for the seam - the property names alone never are.
    const builtIn = defaultSort('asc', {}, {});
    const prepareSpy = jest.spyOn(builtIn, 'prepare');
    const prepareValuesSpy = jest.spyOn(builtIn, 'prepareValues');
    const pairwiseCallable = jest.fn((value: unknown, nextValue: unknown) => builtIn(value, nextValue));
    const probedCompareFn = pairwiseCallable as unknown as PreparedCompareFn;

    probedCompareFn.prepare = (rows: unknown[][], valueIndex: number) => builtIn.prepare(rows, valueIndex);
    probedCompareFn.prepareValues = (values: unknown[]) => builtIn.prepareValues(values);
    probedCompareFn.compare = (keys: unknown, index: number, nextIndex: number) =>
      builtIn.compare(keys as never, index, nextIndex);

    markPreparedCompareFn(probedCompareFn);

    const rows: unknown[][] = [[0, 'charlie'], [1, 'alpha'], [2, 'bravo']];

    sort(rows, PREPARED_ID, ['asc'], [{ columnSorting: { compareFunctionFactory: () => probedCompareFn } }]);

    // The sort really ran: three rows in a scrambled order cannot come out sorted by accident.
    expect(rows.map(row => row[0])).toEqual([1, 2, 0]);
    expect(prepareSpy).toHaveBeenCalledTimes(1);
    expect(prepareSpy).toHaveBeenCalledWith(rows, 1);
    expect(prepareValuesSpy).toHaveBeenCalledTimes(1);
    // The mechanism control: the raw per-comparison callable is what the saving removes, so it must
    // not run at all. Without it, a sort that silently fell back would still pass every order check.
    expect(pairwiseCallable).toHaveBeenCalledTimes(0);
    expect(rows.every(row => row.length === 2)).toBe(true);
  });
});

describe('columnSorting seam guard', () => {
  it('should sort pairwise when a user compare function merely carries the seam property names', () => {
    // A compare function `compareFunctionFactory` returns is arbitrary user code. These three names
    // are not reserved, so carrying them must change nothing about how the column is sorted.
    const decoyPrepare = jest.fn();
    const decoyPrepareValues = jest.fn();
    const decoyCompare = jest.fn(() => 0);
    const userCompareFn = ((value: number, nextValue: number) => {
      if (value === nextValue) {
        return 0;
      }

      return value < nextValue ? -1 : 1;
    }) as CompareFn & Record<string, unknown>;

    userCompareFn.prepare = decoyPrepare;
    userCompareFn.prepareValues = decoyPrepareValues;
    userCompareFn.compare = decoyCompare;

    const rows: unknown[][] = [[0, 3], [1, 1], [2, 2]];

    sort(rows, PREPARED_ID, ['asc'], [{ columnSorting: { compareFunctionFactory: () => userCompareFn } }]);

    expect(rows.map(row => row[0])).toEqual([1, 2, 0]);
    expect(decoyPrepare).not.toHaveBeenCalled();
    expect(decoyPrepareValues).not.toHaveBeenCalled();
    expect(decoyCompare).not.toHaveBeenCalled();
    expect(rows.every(row => row.length === 2)).toBe(true);
  });

  it('should sort pairwise when a custom root comparator returns a function carrying `prepare`', () => {
    const decoyPrepare = jest.fn(
      () => (row: unknown[], nextRow: unknown[]) => (row[1] as number) - (nextRow[1] as number)
    );
    const customRootComparator = () => {
      const comparator = ((row: unknown[], nextRow: unknown[]) =>
        (row[1] as number) - (nextRow[1] as number)) as ((row: unknown[], nextRow: unknown[]) => number)
        & Record<string, unknown>;

      comparator.prepare = decoyPrepare;

      return comparator;
    };

    registerRootComparator('test.columnSorting.decoyRoot', customRootComparator);

    const rows: unknown[][] = [[0, 3], [1, 1], [2, 2]];

    // A probe on the property name would call `prepare()` here and then die on the `cleanup()` that
    // a comparator outside the seam has no reason to provide.
    expect(() => sort(rows, 'test.columnSorting.decoyRoot', ['asc'], [{ columnSorting: {} }])).not.toThrow();
    expect(rows.map(row => row[0])).toEqual([1, 2, 0]);
    expect(decoyPrepare).not.toHaveBeenCalled();
  });

  it('should fall back to the default order when a root comparator factory returns nothing', () => {
    registerRootComparator('test.columnSorting.noComparator', () => undefined);

    const values = [10, 9, 2];

    sort(values, 'test.columnSorting.noComparator', ['asc'], [{ columnSorting: {} }]);

    // `Array.prototype.sort(undefined)` orders by the string form, which is what a broken
    // registration produced before the seam existed.
    expect(values).toEqual([10, 2, 9]);
  });
});
