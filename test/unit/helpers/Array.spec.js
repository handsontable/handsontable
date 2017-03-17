import {
  arrayFlatten,
  arrayAvg,
  arraySum,
  arrayMap,
  arrayMin,
  arrayMax,
} from 'handsontable/helpers/array';

describe('Array helper', () => {
  //
  // Handsontable.helper.arrayFlatten
  //
  describe('arrayFlatten', () => {
    it('should returns the flattened array', () => {
      expect(arrayFlatten([1])).toEqual([1]);
      expect(arrayFlatten([1, 2, 3, [4, 5, 6]])).toEqual([1, 2, 3, 4, 5, 6]);
      expect(arrayFlatten([1, [[[2]]], 3, [[4], [5], [6]]])).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  //
  // Handsontable.helper.arrayAvg
  //
  describe('arrayAvg', () => {
    it('should returns the average value', () => {
      expect(arrayAvg([1])).toBe(1);
      expect(arrayAvg([1, 1, 2, 3, 4])).toBe(2.2);
    });
  });

  //
  // Handsontable.helper.arraySum
  //
  describe('arraySum', () => {
    it('should returns the cumulative value', () => {
      expect(arraySum([1])).toBe(1);
      expect(arraySum([1, 1, 2, 3, 4])).toBe(11);
      expect(arraySum([1, 1, 0, 3.1, 4.2])).toBe(9.3);
    });
  });

  //
  // Handsontable.helper.arrayMap
  //
  describe('arrayMap', () => {
    it('should returns the mapped array', () => {
      expect(arrayMap([1], (a) => a + 1)).toEqual([2]);
      expect(arrayMap([1, 2, 3], () => '')).toEqual(['', '', '']);
    });
  });

  //
  // Handsontable.helper.arrayMin
  //
  describe('arrayMin', () => {
    it('should returns the lowest number from an array (array of numbers)', () => {
      expect(arrayMin([])).toBeUndefined();
      expect(arrayMin([0])).toBe(0);
      expect(arrayMin([0, 0, 0, -1, 3, 2])).toBe(-1);
    });

    it('should returns the lowest string from an array (array of strings)', () => {
      expect(arrayMin(['b', 'a', 'A', 'z', '1'])).toBe('1');
      expect(arrayMin(['b', 'a', 'A', 'z'])).toBe('A');
      expect(arrayMin(['b', 'a', 'z'])).toBe('a');
    });
  });

  //
  // Handsontable.helper.arrayMax
  //
  describe('arrayMax', () => {
    it('should returns the highest number from an array (array of numbers)', () => {
      expect(arrayMax([])).toBeUndefined();
      expect(arrayMax([0])).toBe(0);
      expect(arrayMax([0, 0, 0, -1, 3, 2])).toBe(3);
    });

    it('should returns the highest string from an array (array of strings)', () => {
      expect(arrayMax(['b', 'a', 'A', 'z', 'Z', '1'])).toBe('z');
      expect(arrayMax(['b', 'a', 'A', 'Z', '1'])).toBe('b');
      expect(arrayMax(['a', 'A', 'Z', '1'])).toBe('a');
    });
  });
});
