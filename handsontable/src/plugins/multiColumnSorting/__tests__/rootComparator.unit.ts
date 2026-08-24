import { rootComparator } from 'handsontable/plugins/multiColumnSorting/rootComparator';

/**
 * Creates a numeric ascending/descending compare function for the tests.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @returns {Function} The compare function.
 */
function createNumericCompare(sortOrder: string) {
  return (value: number, nextValue: number) => {
    if (value === nextValue) {
      return 0;
    }

    const result = value < nextValue ? -1 : 1;

    return sortOrder === 'asc' ? result : -result;
  };
}

describe('multiColumnSorting rootComparator', () => {
  it('should invoke each column compare function factory once per sort run, not once per comparison', () => {
    const firstFactory = jest.fn(createNumericCompare);
    const secondFactory = jest.fn(createNumericCompare);
    const columnMetas = [
      { multiColumnSorting: { compareFunctionFactory: firstFactory } },
      { multiColumnSorting: { compareFunctionFactory: secondFactory } },
    ];

    const comparator = rootComparator(['asc', 'desc'], columnMetas);

    comparator([0, 1, 5], [1, 2, 5]);
    comparator([1, 2, 5], [2, 2, 6]);
    comparator([2, 2, 6], [3, 3, 4]);

    expect(firstFactory).toHaveBeenCalledTimes(1);
    expect(firstFactory).toHaveBeenCalledWith('asc', columnMetas[0], columnMetas[0].multiColumnSorting);
    expect(secondFactory).toHaveBeenCalledTimes(1);
    expect(secondFactory).toHaveBeenCalledWith('desc', columnMetas[1], columnMetas[1].multiColumnSorting);
  });

  it('should consult later columns only when all previous columns compare as equal', () => {
    const firstCompare = jest.fn(createNumericCompare('asc'));
    const secondCompare = jest.fn(createNumericCompare('asc'));
    const columnMetas = [
      { multiColumnSorting: { compareFunctionFactory: () => firstCompare } },
      { multiColumnSorting: { compareFunctionFactory: () => secondCompare } },
    ];

    const comparator = rootComparator(['asc', 'asc'], columnMetas);

    // First column decides — the second column must not be consulted.
    expect(comparator([0, 1, 9], [1, 2, 1])).toBe(-1);
    expect(secondCompare).toHaveBeenCalledTimes(0);

    // First column ties — the second column breaks the tie.
    expect(comparator([0, 2, 9], [1, 2, 1])).toBe(1);
    expect(secondCompare).toHaveBeenCalledTimes(1);

    // Both columns tie — the rows keep their relative order.
    expect(comparator([0, 2, 1], [1, 2, 1])).toBe(0);
  });

  it('should resolve the compare function from the column type when no custom factory is defined', () => {
    const columnMetas = [
      { type: 'numeric', multiColumnSorting: {} },
      { type: 'numeric', multiColumnSorting: {} },
    ];

    const comparator = rootComparator(['asc', 'desc'], columnMetas);

    expect(comparator([0, 1, 1], [1, 2, 1])).toBe(-1);
    expect(comparator([0, 2, 1], [1, 2, 2])).toBe(1);
    expect(comparator([0, 2, 1], [1, 2, 1])).toBe(0);
  });
});
