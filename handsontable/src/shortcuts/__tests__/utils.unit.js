import { normalizeEventKey, normalizeKeys } from '../utils';

describe('utils', () => {
  describe('normalizeEventKey', () => {
    it('should lowercase event keys', () => {
      const key = normalizeEventKey('ArrowUp');

      expect(key).toEqual('arrowup');
    });
  });
  describe('normalizeKeys', () => {
    it('should prepare lower-cased string of keys', () => {
      const key = normalizeKeys(['Alt', 'Shift', 'ArrowUp']);

      expect(key).toEqual('alt+arrowup+shift');
    });
  });
});
