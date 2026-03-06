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

    it('should get canonical form from the numpad 0', () => {
      const key = normalizeEventKey({ key: '0', code: 'Numpad0', which: 96 });

      expect(key).toBe('numpad0');
    });

    it('should get canonical form from the numpad 1', () => {
      const key = normalizeEventKey({ key: '1', code: 'Numpad1', which: 97 });

      expect(key).toBe('numpad1');
    });

    it('should get canonical form from the numpad 2', () => {
      const key = normalizeEventKey({ key: '2', code: 'Numpad2', which: 98 });

      expect(key).toBe('numpad2');
    });

    it('should get canonical form from the numpad 3', () => {
      const key = normalizeEventKey({ key: '3', code: 'Numpad3', which: 99 });

      expect(key).toBe('numpad3');
    });

    it('should get canonical form from the numpad 4', () => {
      const key = normalizeEventKey({ key: '4', code: 'Numpad4', which: 100 });

      expect(key).toBe('numpad4');
    });

    it('should get canonical form from the numpad 5', () => {
      const key = normalizeEventKey({ key: '5', code: 'Numpad5', which: 101 });

      expect(key).toBe('numpad5');
    });

    it('should get canonical form from the numpad 6', () => {
      const key = normalizeEventKey({ key: '6', code: 'Numpad6', which: 102 });

      expect(key).toBe('numpad6');
    });

    it('should get canonical form from the numpad 7', () => {
      const key = normalizeEventKey({ key: '7', code: 'Numpad7', which: 103 });

      expect(key).toBe('numpad7');
    });

    it('should get canonical form from the numpad 8', () => {
      const key = normalizeEventKey({ key: '8', code: 'Numpad8', which: 104 });

      expect(key).toBe('numpad8');
    });

    it('should get canonical form from the numpad 9', () => {
      const key = normalizeEventKey({ key: '9', code: 'Numpad9', which: 105 });

      expect(key).toBe('numpad9');
    });

    it('should get canonical form from the multiply sign', () => {
      const key = normalizeEventKey({ key: '*', code: 'multiply', which: 106 });

      expect(key).toBe('multiply');
    });

    it('should get canonical form from the add sign', () => {
      const key = normalizeEventKey({ key: '+', code: 'add', which: 107 });

      expect(key).toBe('add');
    });

    it('should get canonical form from the decimal sign', () => {
      const key = normalizeEventKey({ key: '.', code: 'decimal', which: 108 });

      expect(key).toBe('decimal');
    });

    it('should get canonical form from the subtract sign', () => {
      const key = normalizeEventKey({ key: '-', code: 'subtract', which: 109 });

      expect(key).toBe('subtract');
    });

    it('should get canonical form from the decimal sign', () => {
      const key = normalizeEventKey({ key: '.', code: 'decimal', which: 110 });

      expect(key).toBe('decimal');
    });

    it('should get canonical form from the divide sign', () => {
      const key = normalizeEventKey({ key: '/', code: 'divide', which: 111 });

      expect(key).toBe('divide');
    });

    it('should get canonical form from the F1 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f1', which: 112 });

      expect(key).toBe('f1');
    });

    it('should get canonical form from the F2 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f2', which: 113 });

      expect(key).toBe('f2');
    });

    it('should get canonical form from the F3 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f3', which: 114 });

      expect(key).toBe('f3');
    });

    it('should get canonical form from the F4 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f4', which: 115 });

      expect(key).toBe('f4');
    });

    it('should get canonical form from the F5 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f5', which: 116 });

      expect(key).toBe('f5');
    });

    it('should get canonical form from the F6 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f6', which: 117 });

      expect(key).toBe('f6');
    });

    it('should get canonical form from the F7 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f7', which: 118 });

      expect(key).toBe('f7');
    });

    it('should get canonical form from the F8 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f8', which: 119 });

      expect(key).toBe('f8');
    });

    it('should get canonical form from the F9 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f9', which: 120 });

      expect(key).toBe('f9');
    });

    it('should get canonical form from the F10 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f10', which: 121 });

      expect(key).toBe('f10');
    });

    it('should get canonical form from the F11 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f11', which: 122 });

      expect(key).toBe('f11');
    });

    it('should get canonical form from the F12 key', () => {
      const key = normalizeEventKey({ key: '?', code: 'f12', which: 123 });

      expect(key).toBe('f12');
    });
  });

  describe('normalizeKeys', () => {
    it('should prepare lower-cased string of keys', () => {
      const key = normalizeKeys(['Alt', 'Shift', 'ArrowUp']);

      expect(key).toBe('alt+arrowup+shift');
    });
  });
});
