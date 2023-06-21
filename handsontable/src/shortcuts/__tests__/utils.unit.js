import { normalizeEventKey, normalizeKeys } from '../utils';

describe('utils', () => {
  describe('normalizeEventKey', () => {
    it('should lowercase event key value', () => {
      const key = normalizeEventKey({ key: 'ArrowUp', code: 'ArrowUp' });

      expect(key).toBe('arrowup');
    });

    it('should get the shortcut key from the `code` property when it is a Key', () => {
      const key = normalizeEventKey({ key: 'ł', code: 'KeyL' });

      expect(key).toBe('l');
    });

    it('should get the shortcut key from the `code` property when it is a Digit', () => {
      const key = normalizeEventKey({ key: '€', code: 'Digit3' });

      expect(key).toBe('3');
    });
  });

  describe('normalizeKeys', () => {
    it('should prepare lower-cased string of keys', () => {
      const key = normalizeKeys(['Alt', 'Shift', 'ArrowUp']);

      expect(key).toBe('alt+arrowup+shift');
    });
  });
});
