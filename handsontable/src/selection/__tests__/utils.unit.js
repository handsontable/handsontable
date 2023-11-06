import { CellRange, CellCoords } from 'walkontable';
import {
  detectSelectionType,
  normalizeSelectionFactory,
  normalizeRanges,
  transformSelectionToColumnDistance,
  transformSelectionToRowDistance,
  SELECTION_TYPE_ARRAY,
  SELECTION_TYPE_EMPTY,
  SELECTION_TYPE_OBJECT,
  SELECTION_TYPE_UNRECOGNIZED,
} from '../utils';

describe('selection utils', () => {
  const coords = (row, column) => new CellCoords(row, column);
  const range = (
    rowC,
    columnC,
    rowFrom = rowC,
    columnFrom = columnC,
    rowEnd = rowC,
    columnEnd = columnC
  ) =>
    new CellRange(
      coords(rowC, columnC),
      coords(rowFrom, columnFrom),
      coords(rowEnd, columnEnd)
    );

  describe('detectSelectionType', () => {
    it('should throw an exception when the second argument is being overwritten', () => {
      expect(() => detectSelectionType([1, 1], true)).toThrow();
      expect(() => detectSelectionType([1, 1], false)).toThrow();
      expect(() => detectSelectionType([1, 1], null)).toThrow();
      expect(() => detectSelectionType([1, 1], Symbol(''))).toThrow();
      expect(() => detectSelectionType([1, 1], Symbol('root'))).toThrow();
      expect(() => detectSelectionType([1, 1], Symbol('child'))).toThrow();
    });

    it('should return EMPTY state when the passed data is empty', () => {
      expect(detectSelectionType([])).toBe(SELECTION_TYPE_EMPTY);
      expect(detectSelectionType([[]])).toBe(SELECTION_TYPE_EMPTY);
    });

    it('should return UNRECOGNIZED state when the schema is unrecognized', () => {
      expect(detectSelectionType(null)).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType(1)).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType('z')).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType(true)).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([{}])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType({})).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType()).toBe(SELECTION_TYPE_UNRECOGNIZED);
    });

    it('should return UNRECOGNIZED state when the schema is valid but values are incorect or incomplete', () => {
      expect(detectSelectionType([1])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[1]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType(['prop1'])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([['prop1']])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType(range(1, 2))).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[range(1, 2), range(1, 2)]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[range(1, 2), range(1, 2), range(1, 2)]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[range(1, 2), range(1, 2), range(1, 2), range(1, 2)]]))
        .toBe(SELECTION_TYPE_UNRECOGNIZED);
    });

    it('should ignore nested structures', () => {
      expect(detectSelectionType([[[1, 1]]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[[1, 1, 2, 2]]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[[[1, 1]]]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[[[1, 1, 2, 2]]]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[[[[1, 1]]]]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[[[[1, 1, 2, 2]]]]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
      expect(detectSelectionType([[[[[range(1, 2), range(1, 2)]]]]])).toBe(SELECTION_TYPE_UNRECOGNIZED);
    });

    it('should return ARRAY state on valid an array selection schema', () => {
      expect(detectSelectionType([1, 1])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([1, 1, 2])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([1, 1, 2, 2])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([1, 'prop1'])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([1, 'prop1', 2])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([1, 'prop1', 2, 'prop2'])).toBe(SELECTION_TYPE_ARRAY);

      expect(detectSelectionType([[1, 1]])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([[1, 1, 2]])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([[1, 1, 2, 2]])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([[1, 'prop1']])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([[1, 'prop1', 2]])).toBe(SELECTION_TYPE_ARRAY);
      expect(detectSelectionType([[1, 'prop1', 2, 'prop2']])).toBe(SELECTION_TYPE_ARRAY);
    });

    it('should return OBJECT state on valid range selection schema', () => {
      expect(detectSelectionType([range(1, 2)])).toBe(SELECTION_TYPE_OBJECT);
      expect(detectSelectionType([range(1, 2), range(1, 2)])).toBe(SELECTION_TYPE_OBJECT);
      expect(detectSelectionType([range(1, 2), range(1, 2), range(1, 2)])).toBe(SELECTION_TYPE_OBJECT);
      expect(detectSelectionType([range(1, 2), range(1, 2), range(1, 2), range(1, 2)])).toBe(SELECTION_TYPE_OBJECT);
    });
  });

  describe('normalizeSelectionFactory', () => {
    it('should throw an exception on invalid type', () => {
      expect(() => normalizeSelectionFactory()).toThrow();
      expect(() => normalizeSelectionFactory(0)).toThrow();
      expect(() => normalizeSelectionFactory('0')).toThrow();
      expect(() => normalizeSelectionFactory(null)).toThrow();
      expect(() => normalizeSelectionFactory('foo')).toThrow();
    });

    it('should create normalizer function', () => {
      const normalizer = normalizeSelectionFactory(SELECTION_TYPE_ARRAY);

      expect(normalizer).toBeFunction();
    });

    it('should create ARRAY normalizer function with default options (it modifies coordinates direction)', () => {
      const normalizer = normalizeSelectionFactory(SELECTION_TYPE_ARRAY);

      expect(normalizer([1, 1])).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 1, col: 1 },
      });
      expect(normalizer([1, 1, 2])).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 1 },
      });
      expect(normalizer([1, 1, 2, 2])).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      });
      expect(normalizer([2, 2, 1, 1])).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      });
      expect(normalizer([2, 'prop2', 1, 'prop1'])).toEqual({
        highlight: { row: 1, col: NaN },
        from: { row: 1, col: NaN },
        to: { row: 2, col: NaN },
      });
    });

    it('should create OBJECT normalizer function with default options (it modifies coordinates direction)', () => {
      const normalizer = normalizeSelectionFactory(SELECTION_TYPE_OBJECT);

      expect(normalizer(range(1, 1))).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 1, col: 1 },
      });
      expect(normalizer(range(1, 1, 2, 2))).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      });
      expect(normalizer(range(2, 2, 1, 1))).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      });
    });

    it('should create ARRAY normalizer function which keep origin coordinates direction', () => {
      const normalizer = normalizeSelectionFactory(SELECTION_TYPE_ARRAY, { keepDirection: true });

      expect(normalizer([1, 1, 2, 2])).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      });
      expect(normalizer([2, 2, 1, 1])).toEqual({
        highlight: { row: 2, col: 2 },
        from: { row: 2, col: 2 },
        to: { row: 1, col: 1 },
      });
    });

    it('should create OBJECT normalizer function which keep origin coordinates direction', () => {
      const normalizer = normalizeSelectionFactory(SELECTION_TYPE_OBJECT, { keepDirection: true });

      expect(normalizer(range(1, 1))).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 1, col: 1 },
      });
      expect(normalizer(range(1, 1, 2, 2))).toEqual({
        highlight: { row: 2, col: 2 },
        from: { row: 2, col: 2 },
        to: { row: 1, col: 1 },
      });
      expect(normalizer(range(2, 2, 1, 1))).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      });
    });

    it('should create ARRAY normalizer function which translates column string coordinates to visual indexes', () => {
      const propToColMap = new Map([['prop0', 9], ['prop1', 8], ['prop2', 7], ['prop3', 6]]);
      const propToCol = prop => propToColMap.get(prop);
      const normalizer = normalizeSelectionFactory(SELECTION_TYPE_ARRAY, { propToCol });

      expect(normalizer([1, 1, 2, 2])).toEqual({
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      });
      expect(normalizer([1, 'prop1', 2, 3])).toEqual({
        highlight: { row: 1, col: 3 },
        from: { row: 1, col: 3 },
        to: { row: 2, col: 8 },
      });
      expect(normalizer([1, 'prop1', 2, 'prop2'])).toEqual({
        highlight: { row: 1, col: 7 },
        from: { row: 1, col: 7 },
        to: { row: 2, col: 8 },
      });
    });
  });

  describe('transformSelectionToColumnDistance', () => {
    it('should return an empty array when selection schema is unrecognized', () => {
      expect(transformSelectionToColumnDistance()).toEqual([]);
      expect(transformSelectionToColumnDistance(0)).toEqual([]);
      expect(transformSelectionToColumnDistance(true)).toEqual([]);
      expect(transformSelectionToColumnDistance([])).toEqual([]);
      expect(transformSelectionToColumnDistance([1])).toEqual([]);
      expect(transformSelectionToColumnDistance([[1], [3, 3, 3, 5]])).toEqual([]);
    });

    it('should translate selection ranges passed as an array of arrays to column distances', () => {
      expect(transformSelectionToColumnDistance([[1, 1, 2, 2]])).toEqual([[1, 2]]);
      expect(transformSelectionToColumnDistance([[1, 1], [3, 3, 3, 5]])).toEqual([[1, 1], [3, 3]]);
      expect(transformSelectionToColumnDistance([[-1, 1], [-3, -3, 3, 5]])).toEqual([[0, 6]]);
      expect(transformSelectionToColumnDistance([[1, 1], [3, 3, 3, 5], [5, 1, 6, 3]])).toEqual([[1, 5]]);
      expect(transformSelectionToColumnDistance([[1, 1], [3, 3, 3, 5], [5, 1, 6, 3], [5, 7, 5, 7]]))
        .toEqual([[1, 5], [7, 1]]);
    });

    it('should translate selection ranges passed as an array of CellRange objects to column distances', () => {
      expect(transformSelectionToColumnDistance([range(1, 1, 1, 1, 2, 2)])).toEqual([[1, 2]]);
      expect(transformSelectionToColumnDistance([range(0, 0, 1, 1, -2, -2)])).toEqual([[0, 2]]);
      expect(transformSelectionToColumnDistance([range(1, 1, 1, 1, 2, 2), range(3, 3, 3, 3, 3, 5)]))
        .toEqual([[1, 5]]);
    });
  });

  describe('transformSelectionToRowDistance', () => {
    it('should return an empty array when selection schema is unrecognized', () => {
      expect(transformSelectionToRowDistance()).toEqual([]);
      expect(transformSelectionToRowDistance(0)).toEqual([]);
      expect(transformSelectionToRowDistance(true)).toEqual([]);
      expect(transformSelectionToRowDistance([])).toEqual([]);
      expect(transformSelectionToRowDistance([1])).toEqual([]);
      expect(transformSelectionToRowDistance([[1], [3, 3, 3, 5]])).toEqual([]);
    });

    it('should translate selection ranges passed as an array of arrays to row distances', () => {
      expect(transformSelectionToRowDistance([[1, 1, 2, 2]])).toEqual([[1, 2]]);
      expect(transformSelectionToRowDistance([[1, 1], [3, 3, 5, 3]])).toEqual([[1, 1], [3, 3]]);
      expect(transformSelectionToRowDistance([[1, -1], [-3, -3, 5, 3]])).toEqual([[0, 6]]);
      expect(transformSelectionToRowDistance([[1, 1], [3, 3, 5, 3], [1, 5, 3, 6]])).toEqual([[1, 5]]);
      expect(transformSelectionToRowDistance([[1, 1], [3, 3, 5, 3], [1, 5, 3, 6], [7, 5, 7, 5]]))
        .toEqual([[1, 5], [7, 1]]);
    });

    it('should translate selection ranges passed as an array of CellRange objects to row distances', () => {
      expect(transformSelectionToRowDistance([range(1, 1, 1, 1, 2, 2)])).toEqual([[1, 2]]);
      expect(transformSelectionToRowDistance([range(0, 0, 1, 1, -2, -2)])).toEqual([[0, 2]]);
      expect(transformSelectionToRowDistance([range(1, 1, 1, 1, 2, 2), range(3, 3, 3, 3, 5, 3)]))
        .toEqual([[1, 5]]);
    });
  });

  describe('`normalizeRanges` utils', () => {
    it('should return a correct results for specific range', () => {
      expect(normalizeRanges([
        { startRow: 0, endRow: 0, startCol: 0, endCol: 0 }
      ])).toEqual({
        rows: [0],
        columns: [0],
      });
      expect(normalizeRanges([
        { startRow: 0, endRow: 2, startCol: 3, endCol: 9 }
      ])).toEqual({
        rows: [0, 1, 2],
        columns: [3, 4, 5, 6, 7, 8, 9],
      });
      expect(normalizeRanges([
        { startRow: -3, endRow: 2, startCol: 3, endCol: 9 }
      ])).toEqual({
        rows: [-3, -2, -1, 0, 1, 2],
        columns: [3, 4, 5, 6, 7, 8, 9],
      });
      expect(normalizeRanges([
        { startRow: 2, endRow: -3, startCol: 9, endCol: 3 }
      ])).toEqual({
        rows: [-3, -2, -1, 0, 1, 2],
        columns: [3, 4, 5, 6, 7, 8, 9],
      });
    });

    it('should return a correct results with uniq indexes for multiple ranges', () => {
      // the same coords but defined with opposite directions
      expect(normalizeRanges([
        { startRow: -3, endRow: 2, startCol: 3, endCol: 9 },
        { startRow: 2, endRow: -3, startCol: 9, endCol: 3 },
      ])).toEqual({
        rows: [-3, -2, -1, 0, 1, 2],
        columns: [3, 4, 5, 6, 7, 8, 9],
      });
      expect(normalizeRanges([
        { startRow: -3, endRow: 2, startCol: 3, endCol: 9 },
        { startRow: 2, endRow: -3, startCol: 9, endCol: 3 },
        { startRow: 100, endRow: 101, startCol: 9, endCol: 3 },
        { startRow: 0, endRow: 0, startCol: 22, endCol: 19 },
      ])).toEqual({
        rows: [-3, -2, -1, 0, 1, 2, 100, 101],
        columns: [3, 4, 5, 6, 7, 8, 9, 19, 20, 21, 22],
      });
    });
  });
});
