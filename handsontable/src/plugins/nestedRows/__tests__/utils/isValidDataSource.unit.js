import { isValidDataSource } from '../../utils/isValidDataSource';

describe('NestedRows utils', () => {
  describe('isValidDataSource', () => {
    it('should return `true` for an empty array', () => {
      expect(isValidDataSource([])).toBe(true);
    });

    it('should return `true` for an array of objects', () => {
      expect(isValidDataSource([{ value: 'A1' }, { value: 'A2' }])).toBe(true);
    });

    it('should return `false` for an array of arrays', () => {
      expect(isValidDataSource([['A1'], ['A2']])).toBe(false);
    });

    it('should return `false` for non-arrays', () => {
      expect(isValidDataSource(undefined)).toBe(false);
      expect(isValidDataSource(null)).toBe(false);
      expect(isValidDataSource({})).toBe(false);
    });
  });
});
