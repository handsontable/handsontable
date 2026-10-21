import { positionComparator, rootComparator } from 'handsontable/plugins/columnSorting/rootComparator';

describe('columnSorting positionComparator', () => {
  it('should invoke the compare function factory once per sort run, not once per comparison', () => {
    const compareSpy = jest.fn((value: number, nextValue: number) => {
      if (value === nextValue) {
        return 0;
      }

      return value < nextValue ? -1 : 1;
    });
    const factorySpy = jest.fn(() => compareSpy);
    const columnMeta = { columnSorting: { compareFunctionFactory: factorySpy } };

    const comparator = positionComparator(['asc'], [columnMeta], [[2, 1, 3, 3]]);

    expect(comparator(0, 1)).toBe(1);
    expect(comparator(1, 2)).toBe(-1);
    expect(comparator(2, 3)).toBe(0);

    expect(factorySpy).toHaveBeenCalledTimes(1);
    expect(factorySpy).toHaveBeenCalledWith('asc', columnMeta, columnMeta.columnSorting);
    expect(compareSpy).toHaveBeenCalledTimes(3);
  });

  it('should resolve the compare function from the column type when no custom factory is defined', () => {
    const columnMeta = { type: 'numeric', columnSorting: {} };

    const comparator = positionComparator(['asc'], [columnMeta], [[10, 9, '2', '10', 5, 5]]);

    expect(comparator(0, 1)).toBe(1);
    expect(comparator(2, 3)).toBe(-1);
    expect(comparator(4, 5)).toBe(0);
  });

  it('should read the only sorted column values, indexed by position', () => {
    const columnMeta = { type: 'numeric', columnSorting: {} };
    // A second array is never consulted for a single sorted column.
    const comparator = positionComparator(['asc'], [columnMeta], [[1, 2], [100, 0]]);

    expect(comparator(0, 1)).toBe(-1);
    expect(comparator(1, 0)).toBe(1);
  });

  it('should return the same verdicts as the tuple comparator for the same rows', () => {
    const columnMeta = { type: 'numeric', columnSorting: {} };
    const values = [5, 3, 5, 12];
    const tuples = values.map((value, rowIndex) => [rowIndex, value]);

    const positions = positionComparator(['desc'], [columnMeta], [values]);
    const tupled = rootComparator(['desc'], [columnMeta]);

    for (let a = 0; a < values.length; a += 1) {
      for (let b = 0; b < values.length; b += 1) {
        expect(positions(a, b)).toBe(tupled(tuples[a], tuples[b]));
      }
    }
  });

  it('should sort a `numeric` column through the pairwise path, exactly as the tuple path does', () => {
    // `sortFunction/numeric.ts` does not implement the prepared seam, so the parallel-value-arrays
    // path reaches it pairwise. The values mix parseable numbers, numeric strings, junk and the
    // three empty values, and the order has to match the tuple comparator verdict for verdict.
    const columnMeta = { type: 'numeric', columnSorting: { sortEmptyCells: false } };
    const values: unknown[] = [10, '2', null, 'abc', -3, '', 2.5, undefined, '10'];
    const tuples = values.map((value, rowIndex) => [rowIndex, value]);

    (['asc', 'desc'] as const).forEach((sortOrder) => {
      const positions = values.map((value, position) => position);

      positions.sort(positionComparator([sortOrder], [columnMeta], [values]));

      const sortedTuples = tuples.slice();

      sortedTuples.sort(rootComparator([sortOrder], [columnMeta]));

      expect(positions).toEqual(sortedTuples.map(tuple => tuple[0]));
    });
  });

  it('should keep tied rows in their source order when used to sort a positions array', () => {
    const columnMeta = { type: 'numeric', columnSorting: {} };
    //                      pos: 0  1  2  3  4  5
    const values: unknown[] = [2, 1, 2, 1, 2, 1];
    const positions = [0, 1, 2, 3, 4, 5];

    positions.sort(positionComparator(['asc'], [columnMeta], [values]));

    // `Array.prototype.sort` is stable and the comparator is a pure function of the values, so the
    // three 1s and the three 2s each keep the order the gather loop produced.
    expect(positions).toEqual([1, 3, 5, 0, 2, 4]);
  });
});
