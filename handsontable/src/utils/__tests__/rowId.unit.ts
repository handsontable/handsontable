import { getRowIdFromRowData, isSourceRowData } from '../rowId';

describe('rowId', () => {
  describe('getRowIdFromRowData', () => {
    it('should read a property of a row object', () => {
      expect(getRowIdFromRowData({ id: 7, name: 'A' }, 'id')).toBe(7);
    });

    it('should walk a dotted property path', () => {
      expect(getRowIdFromRowData({ meta: { key: 'k-1' } }, 'meta.key')).toBe('k-1');
    });

    it('should return `undefined` when a step of the path is `null` or not an object', () => {
      expect(getRowIdFromRowData({ meta: null }, 'meta.id')).toBeUndefined();
      expect(getRowIdFromRowData({ meta: 'text' }, 'meta.id')).toBeUndefined();
      expect(getRowIdFromRowData({ meta: { id: null } }, 'meta.id')).toBeNull();
    });

    it('should read a row array by index', () => {
      expect(getRowIdFromRowData(['a', 'b'], '1')).toBe('b');
    });

    it('should call a function key with the row', () => {
      const row = { country: 'PL', code: 3 };

      expect(getRowIdFromRowData(row, value => (value === row ? 'PL-3' : null))).toBe('PL-3');
    });

    it('should return `undefined` with no key, for a missing property, and for a value that is not a row', () => {
      expect(getRowIdFromRowData({ id: 1 }, undefined)).toBeUndefined();
      expect(getRowIdFromRowData({ id: 1 }, null)).toBeUndefined();
      expect(getRowIdFromRowData({ id: 1 }, 'missing')).toBeUndefined();
      expect(getRowIdFromRowData({ id: 1 }, 'missing.deeper')).toBeUndefined();
      expect(getRowIdFromRowData(null, 'id')).toBeUndefined();
      expect(getRowIdFromRowData(undefined, () => 'never')).toBeUndefined();
    });
  });

  describe('isSourceRowData', () => {
    it('should accept objects and arrays only', () => {
      expect(isSourceRowData({})).toBe(true);
      expect(isSourceRowData([])).toBe(true);
      expect(isSourceRowData(null)).toBe(false);
      expect(isSourceRowData('row')).toBe(false);
      expect(isSourceRowData(1)).toBe(false);
    });
  });
});
