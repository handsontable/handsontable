import mergeSort from 'handsontable/utils/sortingAlgorithms/mergeSort';

/**
 * Refactored implementation of megeSort tests by Github user mgechev
 * (part of javascript-algorithms project - all project contributors at repository website)
 *
 * Link to repository: https://github.com/mgechev/javascript-algorithms
 */

describe('mergeSort', () => {
  it('should work with sorted arrays', () => {
    expect(mergeSort([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
  });

  it('should work with empty array', () => {
    expect(mergeSort([])).toEqual([]);
  });

  it('should sort properly the array containg strings', () => {
    expect(mergeSort(['z', 'c', '', '1', 'a'])).toEqual(['', '1', 'a', 'c', 'z']);
  });

  it('should sort lexically the array containg numbers (by default)', () => {
    expect(mergeSort([3, 40, 100, 2000])).toEqual([100, 2000, 3, 40]);
  });

  it('should not change the order when such comparator is provided', () => {
    const compareFunction = function() {
      return 0;
    };

    expect(mergeSort([1, 2, 11, 3], compareFunction)).toEqual([1, 2, 11, 3]);
  });

  it('should sort the numbers in ascending order when such comparator is provided', () => {
    const compareFunction = function(a, b) {
      return a - b;
    };

    expect(mergeSort([1, 2, 11, 3], compareFunction)).toEqual([1, 2, 3, 11]);
  });

  it('should sort the numbers in descending order when such comparator is provided', () => {
    const compareFunction = function(a, b) {
      return b - a;
    };

    expect(mergeSort([1, 2, 11, 3], compareFunction)).toEqual([11, 3, 2, 1]);
  });
});
