import {
  getShiftedIndexAfterInsert,
  getShiftedIndexAfterRemove,
  getViewportUnionRanges,
  isIndexInViewportUnion,
} from '../utils';

describe('CustomBorders utils', () => {
  describe('getShiftedIndexAfterInsert', () => {
    it('should shift an index at or after the insertion point by the inserted amount', () => {
      expect(getShiftedIndexAfterInsert(2, 2, 1)).toBe(3);
      expect(getShiftedIndexAfterInsert(4, 2, 1)).toBe(5);
      expect(getShiftedIndexAfterInsert(4, 2, 3)).toBe(7);
    });

    it('should not shift an index before the insertion point', () => {
      expect(getShiftedIndexAfterInsert(1, 2, 1)).toBe(1);
      expect(getShiftedIndexAfterInsert(0, 2, 5)).toBe(0);
    });
  });

  describe('getShiftedIndexAfterRemove', () => {
    it('should shift an index below the removed range down by the removed amount', () => {
      expect(getShiftedIndexAfterRemove(2, 1, 1)).toBe(1);
      expect(getShiftedIndexAfterRemove(5, 1, 2)).toBe(3);
    });

    it('should return -1 when the index itself was removed', () => {
      expect(getShiftedIndexAfterRemove(2, 2, 1)).toBe(-1);
      expect(getShiftedIndexAfterRemove(3, 2, 2)).toBe(-1);
      expect(getShiftedIndexAfterRemove(2, 2, 2)).toBe(-1);
    });

    it('should not shift an index above the removed range', () => {
      expect(getShiftedIndexAfterRemove(1, 2, 1)).toBe(1);
      expect(getShiftedIndexAfterRemove(0, 2, 5)).toBe(0);
    });
  });

  describe('getViewportUnionRanges', () => {
    it('should return only the master range when nothing is frozen', () => {
      expect(getViewportUnionRanges(5, 10, 0, 0, 50)).toEqual([[5, 10]]);
    });

    it('should prepend the frozen-start range when it is outside the master range', () => {
      // fixedRowsTop: 2, master rendered rows 20..30
      expect(getViewportUnionRanges(20, 30, 2, 0, 50)).toEqual([[0, 1], [20, 30]]);
    });

    it('should append the frozen-end range', () => {
      // fixedRowsBottom: 3 of 50 rows -> rows 47..49
      expect(getViewportUnionRanges(20, 30, 0, 3, 50)).toEqual([[20, 30], [47, 49]]);
    });

    it('should clip the master range so ranges stay disjoint when they overlap the frozen areas', () => {
      // master range 0..10 already covers the frozen-start rows
      expect(getViewportUnionRanges(0, 10, 2, 0, 50)).toEqual([[0, 1], [2, 10]]);
    });

    it('should handle a fully frozen table', () => {
      expect(getViewportUnionRanges(0, 4, 5, 0, 5)).toEqual([[0, 4]]);
    });
  });

  describe('isIndexInViewportUnion', () => {
    it('should accept indexes in the frozen-start area regardless of the master range', () => {
      expect(isIndexInViewportUnion(0, 51, 61, 2, 0, 100)).toBe(true);
      expect(isIndexInViewportUnion(1, 51, 61, 2, 0, 100)).toBe(true);
      expect(isIndexInViewportUnion(2, 51, 61, 2, 0, 100)).toBe(false);
    });

    it('should accept indexes in the master rendered range', () => {
      expect(isIndexInViewportUnion(55, 51, 61, 2, 0, 100)).toBe(true);
      expect(isIndexInViewportUnion(62, 51, 61, 2, 0, 100)).toBe(false);
    });

    it('should accept indexes in the frozen-end area', () => {
      expect(isIndexInViewportUnion(98, 10, 20, 0, 3, 100)).toBe(true);
      expect(isIndexInViewportUnion(96, 10, 20, 0, 3, 100)).toBe(false);
    });

    it('should reject out-of-bounds indexes', () => {
      expect(isIndexInViewportUnion(-1, 0, 10, 2, 0, 50)).toBe(false);
      expect(isIndexInViewportUnion(50, 0, 10, 2, 0, 50)).toBe(false);
    });
  });
});
