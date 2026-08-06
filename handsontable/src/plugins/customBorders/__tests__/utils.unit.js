import { getShiftedIndexAfterInsert, getShiftedIndexAfterRemove } from '../utils';

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
});
