import { positionComparator, rootComparator } from 'handsontable/plugins/multiColumnSorting/rootComparator';

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

describe('multiColumnSorting positionComparator', () => {
  it('should invoke each column compare function factory once per sort run, not once per comparison', () => {
    const firstFactory = jest.fn(createNumericCompare);
    const secondFactory = jest.fn(createNumericCompare);
    const columnMetas = [
      { multiColumnSorting: { compareFunctionFactory: firstFactory } },
      { multiColumnSorting: { compareFunctionFactory: secondFactory } },
    ];
    const columnValues = [[1, 2, 2, 3], [5, 5, 6, 4]];

    const comparator = positionComparator(['asc', 'desc'], columnMetas, columnValues);

    comparator(0, 1);
    comparator(1, 2);
    comparator(2, 3);

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
    //                  position:  0  1  2  3
    const columnValues = [[1, 2, 2, 2], [9, 1, 9, 1]];

    const comparator = positionComparator(['asc', 'asc'], columnMetas, columnValues);

    // First column decides - the second column must not be consulted.
    expect(comparator(0, 1)).toBe(-1);
    expect(secondCompare).toHaveBeenCalledTimes(0);

    // First column ties - the second column breaks the tie.
    expect(comparator(2, 3)).toBe(1);
    expect(secondCompare).toHaveBeenCalledTimes(1);

    // Both columns tie - the rows keep their relative order.
    expect(comparator(1, 3)).toBe(0);
  });

  it('should read each sorted column values from its own array, indexed by position', () => {
    const columnMetas = [
      { type: 'numeric', multiColumnSorting: {} },
      { type: 'numeric', multiColumnSorting: {} },
    ];
    const columnValues = [[1, 2, 2, 2], [1, 1, 1, 2]];

    const comparator = positionComparator(['asc', 'desc'], columnMetas, columnValues);

    expect(comparator(0, 1)).toBe(-1);
    expect(comparator(2, 3)).toBe(1);
    expect(comparator(1, 2)).toBe(0);
  });

  it('should return the same verdicts as the tuple comparator for the same rows', () => {
    const columnMetas = [
      { type: 'numeric', multiColumnSorting: {} },
      { type: 'numeric', multiColumnSorting: {} },
      { type: 'numeric', multiColumnSorting: {} },
    ];
    const columnValues = [[2, 2, 1, 2], [7, 7, 3, 9], [4, 5, 5, 5]];
    const tuples = columnValues[0].map(
      (_, position) => [position, columnValues[0][position], columnValues[1][position], columnValues[2][position]]);

    const positions = positionComparator(['asc', 'desc', 'asc'], columnMetas, columnValues);
    const tupled = rootComparator(['asc', 'desc', 'asc'], columnMetas);

    for (let a = 0; a < tuples.length; a += 1) {
      for (let b = 0; b < tuples.length; b += 1) {
        expect(positions(a, b)).toBe(tupled(tuples[a], tuples[b]));
      }
    }
  });

  it('should keep rows tied on every sorted column in their source order', () => {
    const columnMetas = [
      { type: 'numeric', multiColumnSorting: {} },
      { type: 'numeric', multiColumnSorting: {} },
    ];
    //                  position:  0  1  2  3  4
    const columnValues = [[2, 1, 2, 1, 2], [8, 8, 8, 8, 8]];
    const positions = [0, 1, 2, 3, 4];

    positions.sort(positionComparator(['asc', 'asc'], columnMetas, columnValues));

    expect(positions).toEqual([1, 3, 0, 2, 4]);
  });
});
