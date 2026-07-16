import { rootComparator } from 'handsontable/plugins/columnSorting/rootComparator';

describe('columnSorting rootComparator', () => {
  it('should invoke the compare function factory once per sort run, not once per comparison', () => {
    const compareSpy = jest.fn((value: number, nextValue: number) => {
      if (value === nextValue) {
        return 0;
      }

      return value < nextValue ? -1 : 1;
    });
    const factorySpy = jest.fn(() => compareSpy);
    const columnMeta = { columnSorting: { compareFunctionFactory: factorySpy } };

    const comparator = rootComparator(['asc'], [columnMeta]);

    expect(comparator([0, 2], [1, 1])).toBe(1);
    expect(comparator([1, 1], [2, 3])).toBe(-1);
    expect(comparator([2, 3], [3, 3])).toBe(0);

    expect(factorySpy).toHaveBeenCalledTimes(1);
    expect(factorySpy).toHaveBeenCalledWith('asc', columnMeta, columnMeta.columnSorting);
    expect(compareSpy).toHaveBeenCalledTimes(3);
  });

  it('should resolve the compare function from the column type when no custom factory is defined', () => {
    const columnMeta = { type: 'numeric', columnSorting: {} };

    const comparator = rootComparator(['asc'], [columnMeta]);

    expect(comparator([0, 10], [1, 9])).toBe(1);
    expect(comparator([0, '2'], [1, '10'])).toBe(-1);
    expect(comparator([0, 5], [1, 5])).toBe(0);
  });

  it('should compare only the value stored right after the row index in the sorted tuples', () => {
    const columnMeta = { type: 'numeric', columnSorting: {} };

    const comparator = rootComparator(['asc'], [columnMeta]);

    // Tuples are [rowIndex, value] — the row index (999 vs 1) must not affect the result.
    expect(comparator([999, 1], [1, 2])).toBe(-1);
  });
});
