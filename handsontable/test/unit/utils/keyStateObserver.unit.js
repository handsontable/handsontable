import {
  _getRefCount,
  _resetState,
  isPressed,
  isPressedCtrlKey,
  startObserving,
  stopObserving,
} from 'handsontable/utils/keyStateObserver';

describe('keyStateObserver', () => {
  afterEach(() => {
    _resetState();
  });

  describe('.startObserving', () => {
    it('should internally keep calls count to make the dom listener removable', () => {
      startObserving(document);
      startObserving(document);
      startObserving(document);
      startObserving(document);

      expect(_getRefCount()).toBe(4);
    });
  });

  describe('.stopObserving', () => {
    it('should internally keep calls count to make the dom listener removable', () => {
      startObserving(document);
      startObserving(document);
      startObserving(document);
      startObserving(document);

      expect(_getRefCount()).toBe(4);

      stopObserving(document);
      stopObserving(document);
      stopObserving(document);
      stopObserving(document);
      stopObserving(document);
      stopObserving(document);

      expect(_getRefCount()).toBe(0);
    });

    it('should reset all key states after the last stopObserving function is called', () => {
      startObserving(document);

      expect(isPressed('ENTER')).toBe(false);
      expect(isPressed('BACKSPACE')).toBe(false);
      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 8 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 91 }));

      expect(isPressed('ENTER')).toBe(true);
      expect(isPressed('BACKSPACE')).toBe(true);
      expect(isPressedCtrlKey()).toBe(true);

      stopObserving(document);

      expect(isPressed('ENTER')).toBe(false);
      expect(isPressed('BACKSPACE')).toBe(false);
      expect(isPressedCtrlKey()).toBe(false);
    });
  });

  describe('.isPressedCtrlKey', () => {
    it('should return `true` when CTRL key is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 17 }));

      expect(isPressedCtrlKey()).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 17 }));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `true` when left CMD key is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 91 }));

      expect(isPressedCtrlKey()).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 91 }));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `true` when right CMD key is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 93 }));

      expect(isPressedCtrlKey()).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 93 }));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `true` when CMD key is pressed (macOS on FF)', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 224 }));

      expect(isPressedCtrlKey()).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 224 }));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `false` when left CMD key AND F is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 91 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 70 }));
      window.dispatchEvent(new FocusEvent('blur'));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `false` when right CMD key AND F is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 93 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 70 }));
      window.dispatchEvent(new FocusEvent('blur'));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `false` when CMD key AND F is pressed (macOS on FF)', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 224 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 70 }));
      window.dispatchEvent(new FocusEvent('blur'));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `false` when CTRL key AND F is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 17 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 70 }));
      window.dispatchEvent(new FocusEvent('blur'));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `false` when left CMD key AND D is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 91 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 68 }));
      window.dispatchEvent(new FocusEvent('blur'));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `false` when right CMD key AND D is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 93 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 68 }));
      window.dispatchEvent(new FocusEvent('blur'));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `false` when CMD key AND D is pressed (macOS on FF)', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 224 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 68 }));
      window.dispatchEvent(new FocusEvent('blur'));

      expect(isPressedCtrlKey()).toBe(false);
    });

    it('should return `false` when CTRL key AND D is pressed', () => {
      startObserving(document);

      expect(isPressedCtrlKey()).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 17 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 68 }));
      window.dispatchEvent(new FocusEvent('blur'));

      expect(isPressedCtrlKey()).toBe(false);
    });
  });

  describe('.isPressed', () => {
    it('should return `true` when ENTER key is pressed', () => {
      startObserving(document);

      expect(isPressed('ENTER')).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));

      expect(isPressed('ENTER')).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 13 }));

      expect(isPressed('ENTER')).toBe(false);
    });

    it('should return `true` when multiple expected keys are pressed', () => {
      startObserving(document);

      expect(isPressed('ENTER|BACKSPACE')).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));

      expect(isPressed('ENTER|BACKSPACE')).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 13 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 8 }));

      expect(isPressed('ENTER|BACKSPACE')).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 8 }));
    });
  });
});
