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

    it('should get the shortcut key from the `code` property when it is a Minus', () => {
      // emulates pressing the Shift+Minus keys
      const key = normalizeEventKey({ key: '_', code: 'Minus' });

      expect(key).toBe('minus');
    });

    it('should get the shortcut key from the `code` property when it is a Equal', () => {
      // emulates pressing the Shift+Equal keys
      const key = normalizeEventKey({ key: '+', code: 'Equal' });

      expect(key).toBe('equal');
    });

    it('should get the shortcut key from the `code` property when it is a BracketLeft', () => {
      // emulates pressing the Shift+BracketLeft keys
      const key = normalizeEventKey({ key: '{', code: 'BracketLeft' });

      expect(key).toBe('bracketleft');
    });

    it('should get the shortcut key from the `code` property when it is a BracketRight', () => {
      // emulates pressing the Shift+BracketRight keys
      const key = normalizeEventKey({ key: '}', code: 'BracketRight' });

      expect(key).toBe('bracketright');
    });

    it('should get the shortcut key from the `code` property when it is a Backslash', () => {
      // emulates pressing the Shift+Backslash keys
      const key = normalizeEventKey({ key: '|', code: 'Backslash' });

      expect(key).toBe('backslash');
    });

    it('should get the shortcut key from the `code` property when it is a Semicolon', () => {
      // emulates pressing the Shift+Semicolon keys
      const key = normalizeEventKey({ key: ':', code: 'Semicolon' });

      expect(key).toBe('semicolon');
    });

    it('should get the shortcut key from the `code` property when it is a Quote', () => {
      // emulates pressing the Shift+Quote keys
      const key = normalizeEventKey({ key: '"', code: 'Quote' });

      expect(key).toBe('quote');
    });

    it('should get the shortcut key from the `code` property when it is a Comma', () => {
      // emulates pressing the Shift+Comma keys
      const key = normalizeEventKey({ key: '>', code: 'Comma' });

      expect(key).toBe('comma');
    });

    it('should get the shortcut key from the `code` property when it is a Period', () => {
      // emulates pressing the Shift+Period keys
      const key = normalizeEventKey({ key: '<', code: 'Period' });

      expect(key).toBe('period');
    });

    it('should get the shortcut key from the `code` property when it is a Slash', () => {
      // emulates pressing the Shift+Slash keys
      const key = normalizeEventKey({ key: '?', code: 'Slash' });

      expect(key).toBe('slash');
    });
  });

  describe('normalizeKeys', () => {
    it('should prepare lower-cased string of keys', () => {
      const key = normalizeKeys(['Alt', 'Shift', 'ArrowUp']);

      expect(key).toBe('alt+arrowup+shift');
    });
  });
});
