import { normalizeEventKey, normalizeKeys } from '../utils';

describe('utils', () => {
  describe('normalizeEventKey', () => {
    it('should lowercase event key value', () => {
      const key = normalizeEventKey({ key: 'ArrowUp', code: 'ArrowUp', which: 38 });

      expect(key).toBe('arrowup');
    });

    it('should get canonical form from the letter', () => {
      const key = normalizeEventKey({ key: 'ł', code: 'KeyL', which: 76 });

      expect(key).toBe('l');
    });

    it('should get canonical form from the digit', () => {
      const key = normalizeEventKey({ key: '€', code: 'Digit3', which: 51 });

      expect(key).toBe('3');
    });

    it('should get canonical form from the minus sign', () => {
      // emulates pressing the Shift+Minus keys
      const key = normalizeEventKey({ key: '-', code: 'Minus', which: 189 });

      expect(key).toBe('minus');
    });

    it('should get canonical form from the equals sign', () => {
      // emulates pressing the Shift+Equal keys
      const key = normalizeEventKey({ key: '+', code: 'Equal', which: 187 });

      expect(key).toBe('equal');
    });

    it('should get canonical form from the bracket left sign', () => {
      // emulates pressing the Shift+BracketLeft keys
      const key = normalizeEventKey({ key: '{', code: 'BracketLeft', which: 219 });

      expect(key).toBe('bracketleft');
    });

    it('should get canonical form from the bracket right sign', () => {
      // emulates pressing the Shift+BracketRight keys
      const key = normalizeEventKey({ key: '}', code: 'BracketRight', which: 221 });

      expect(key).toBe('bracketright');
    });

    it('should get canonical form from the backslash sign', () => {
      // emulates pressing the Shift+Backslash keys
      const key = normalizeEventKey({ key: '|', code: 'Backslash', which: 220 });

      expect(key).toBe('backslash');
    });

    it('should get canonical form from the semicolon sign', () => {
      // emulates pressing the Shift+Semicolon keys
      const key = normalizeEventKey({ key: ':', code: 'Semicolon', which: 186 });

      expect(key).toBe('semicolon');
    });

    it('should get canonical form from the quote sign', () => {
      // emulates pressing the Shift+Quote keys
      const key = normalizeEventKey({ key: '"', code: 'Quote', which: 222 });

      expect(key).toBe('quote');
    });

    it('should get canonical form from the comma sign', () => {
      // emulates pressing the Shift+Comma keys
      const key = normalizeEventKey({ key: '>', code: 'Comma', which: 188 });

      expect(key).toBe('comma');
    });

    it('should get canonical form from the period sign', () => {
      // emulates pressing the Shift+Period keys
      const key = normalizeEventKey({ key: '<', code: 'Period', which: 190 });

      expect(key).toBe('period');
    });

    it('should get canonical form from the slash sign', () => {
      // emulates pressing the Shift+Slash keys
      const key = normalizeEventKey({ key: '?', code: 'Slash', which: 191 });

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
