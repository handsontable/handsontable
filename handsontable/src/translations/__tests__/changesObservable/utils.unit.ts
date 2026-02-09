import { arrayDiff } from 'handsontable/translations/changesObservable/utils';

describe('ChangesObservable', () => {
  describe('arrayDiff', () => {
    it('should diff arrays when the base array is empty', () => {
      const baseArray = [];

      expect(arrayDiff(baseArray, [4, 5, 7, 1])).toEqual([
        { op: 'insert', index: 0, oldValue: undefined, newValue: 4 },
        { op: 'insert', index: 1, oldValue: undefined, newValue: 5 },
        { op: 'insert', index: 2, oldValue: undefined, newValue: 7 },
        { op: 'insert', index: 3, oldValue: undefined, newValue: 1 },
      ]);
    });

    it('should return an empty array when both arrays are the same', () => {
      expect(arrayDiff([4, 7, 9], [4, 7, 9])).toEqual([]);
      expect(arrayDiff([], [])).toEqual([]);
    });

    it('should diff arrays when the passed new array has the same size as base array', () => {
      const baseArray = [4, 7, 9];

      expect(arrayDiff(baseArray, [0, 7, 9])).toEqual([
        { op: 'replace', index: 0, oldValue: 4, newValue: 0 },
      ]);
      expect(arrayDiff(baseArray, [4, 0, 9])).toEqual([
        { op: 'replace', index: 1, oldValue: 7, newValue: 0 },
      ]);
      expect(arrayDiff(baseArray, [4, 7, 0])).toEqual([
        { op: 'replace', index: 2, oldValue: 9, newValue: 0 },
      ]);
      expect(arrayDiff(baseArray, [1, 2, 3])).toEqual([
        { op: 'replace', index: 0, oldValue: 4, newValue: 1 },
        { op: 'replace', index: 1, oldValue: 7, newValue: 2 },
        { op: 'replace', index: 2, oldValue: 9, newValue: 3 },
      ]);
    });

    it('should diff arrays when the passed new array is bigger than base array', () => {
      const baseArray = [4, 7];

      expect(arrayDiff(baseArray, [4, 5, 7, 1])).toEqual([
        { op: 'replace', index: 1, oldValue: 7, newValue: 5 },
        { op: 'insert', index: 2, oldValue: undefined, newValue: 7 },
        { op: 'insert', index: 3, oldValue: undefined, newValue: 1 },
      ]);
      expect(arrayDiff(baseArray, [7, 1, 0])).toEqual([
        { op: 'replace', index: 0, oldValue: 4, newValue: 7 },
        { op: 'replace', index: 1, oldValue: 7, newValue: 1 },
        { op: 'insert', index: 2, oldValue: undefined, newValue: 0 },
      ]);
      expect(arrayDiff(baseArray, [9, 7, 10])).toEqual([
        { op: 'replace', index: 0, oldValue: 4, newValue: 9 },
        { op: 'insert', index: 2, oldValue: undefined, newValue: 10 },
      ]);
    });

    it('should diff arrays when the passed new array is smaller than base array', () => {
      const baseArray = [4, 7, 9, 5, 8];

      expect(arrayDiff(baseArray, [4, 7, 5, 2])).toEqual([
        { op: 'replace', index: 2, oldValue: 9, newValue: 5 },
        { op: 'replace', index: 3, oldValue: 5, newValue: 2 },
        { op: 'remove', index: 4, oldValue: 8, newValue: undefined },
      ]);
      expect(arrayDiff(baseArray, [0, 7, 1, 2])).toEqual([
        { op: 'replace', index: 0, oldValue: 4, newValue: 0 },
        { op: 'replace', index: 2, oldValue: 9, newValue: 1 },
        { op: 'replace', index: 3, oldValue: 5, newValue: 2 },
        { op: 'remove', index: 4, oldValue: 8, newValue: undefined },
      ]);
      expect(arrayDiff(baseArray, [7, 7])).toEqual([
        { op: 'replace', index: 0, oldValue: 4, newValue: 7 },
        { op: 'remove', index: 2, oldValue: 9, newValue: undefined },
        { op: 'remove', index: 3, oldValue: 5, newValue: undefined },
        { op: 'remove', index: 4, oldValue: 8, newValue: undefined },
      ]);
      expect(arrayDiff(baseArray, [4])).toEqual([
        { op: 'remove', index: 1, oldValue: 7, newValue: undefined },
        { op: 'remove', index: 2, oldValue: 9, newValue: undefined },
        { op: 'remove', index: 3, oldValue: 5, newValue: undefined },
        { op: 'remove', index: 4, oldValue: 8, newValue: undefined },
      ]);
      expect(arrayDiff(baseArray, [])).toEqual([
        { op: 'remove', index: 0, oldValue: 4, newValue: undefined },
        { op: 'remove', index: 1, oldValue: 7, newValue: undefined },
        { op: 'remove', index: 2, oldValue: 9, newValue: undefined },
        { op: 'remove', index: 3, oldValue: 5, newValue: undefined },
        { op: 'remove', index: 4, oldValue: 8, newValue: undefined },
      ]);
    });
  });
});
