// Imported through the barrel, exactly as `columnSorting.ts` does. Reaching for
// `sortService/engine` first would initialize the module cycle in the opposite order and leave
// `sortFunction/default.ts`'s imported sort-result constants undefined.
import { sort, registerRootComparator } from 'handsontable/plugins/columnSorting/sortService';
import { rootComparator } from 'handsontable/plugins/multiColumnSorting/rootComparator';

const PREPARED_ID = 'test.multiColumnSorting.prepared';

registerRootComparator(PREPARED_ID, rootComparator);

/**
 * Creates a plain (never prepared) compare function, the shape a user-supplied factory returns.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @returns {Function} The compare function.
 */
function createPlainCompare(sortOrder: string) {
  return (value: unknown, nextValue: unknown) => {
    if (value === nextValue) {
      return 0;
    }

    const result = (value as number) < (nextValue as number) ? -1 : 1;

    return sortOrder === 'asc' ? result : -result;
  };
}

describe('multiColumnSorting prepared comparator', () => {
  it('should mix a prepared built-in column with a plain user column and tie-break correctly', () => {
    const plainFactory = jest.fn(createPlainCompare);
    // Column 0 has no custom factory, so it resolves to the prepared built-in default compare
    // function. Column 1 is a user-supplied plain function that never exposes the seam.
    const columnMetas = [
      { multiColumnSorting: {} },
      { multiColumnSorting: { compareFunctionFactory: plainFactory } },
    ];
    const rows: unknown[][] = [
      [0, 'b', 2],
      [1, 'a', 9],
      [2, 'b', 1],
      [3, 'a', 3],
    ];

    sort(rows, PREPARED_ID, ['asc', 'asc'], columnMetas);

    expect(rows.map(row => row[0])).toEqual([3, 1, 2, 0]);
    // The factory is still resolved once per sort run, not once per comparison.
    expect(plainFactory).toHaveBeenCalledTimes(1);
    // The decoration is popped again, so the documented `[rowIndex, ...values]` shape holds.
    expect(rows.every(row => row.length === 3)).toBe(true);
  });

  it('should consult the second column only when the first one ties', () => {
    const secondCompare = jest.fn(createPlainCompare('asc'));
    const columnMetas = [
      { multiColumnSorting: {} },
      { multiColumnSorting: { compareFunctionFactory: () => secondCompare } },
    ];
    const rows: unknown[][] = [
      [0, 'b', 1],
      [1, 'a', 2],
    ];

    sort(rows, PREPARED_ID, ['asc', 'asc'], columnMetas);

    expect(rows.map(row => row[0])).toEqual([1, 0]);
    expect(secondCompare).toHaveBeenCalledTimes(0);
  });

  it('should sort two prepared columns identically to the per-comparison path', () => {
    const columnMetas = [
      { multiColumnSorting: {} },
      { multiColumnSorting: {} },
    ];
    const rows: unknown[][] = [
      [0, 'b', 'x'],
      [1, 'a', null],
      [2, 'b', 'a'],
      [3, 'a', 'b'],
      [4, 'b', 'x'],
    ];
    const expected = rows
      .slice()
      .sort(rootComparator(['asc', 'desc'], columnMetas))
      .map(row => row[0]);

    sort(rows, PREPARED_ID, ['asc', 'desc'], columnMetas);

    expect(rows.map(row => row[0])).toEqual(expected);
  });
});
