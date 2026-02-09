import { isLeftClick, isRightClick, isTouchEvent } from 'handsontable/helpers/dom/event';

describe('DomEvent helper', () => {
  //
  // Handsontable.dom.isLeftClick
  //
  describe('isLeftClick', () => {
    it('should return true for valid mouse events', () => {
      expect(isLeftClick({ button: 0 })).toBe(true);
    });

    it('should return false for invalid mouse events', () => {
      expect(isLeftClick({ button: '0' })).toBe(false);
      expect(isLeftClick({ button: 1 })).toBe(false);
      expect(isLeftClick({ button: 2 })).toBe(false);
      expect(isLeftClick({ button: 3 })).toBe(false);
      expect(isLeftClick({ button: null })).toBe(false);
      expect(isLeftClick({ button: undefined })).toBe(false);
      expect(isLeftClick({})).toBe(false);
    });
  });
  //
  // Handsontable.dom.isRightClick
  //
  describe('isRightClick', () => {
    it('should return true for valid mouse events', () => {
      expect(isRightClick({ button: 2 })).toBe(true);
    });

    it('should return false for invalid mouse events', () => {
      expect(isRightClick({ button: '0' })).toBe(false);
      expect(isRightClick({ button: 1 })).toBe(false);
      expect(isRightClick({ button: -2 })).toBe(false);
      expect(isRightClick({ button: 3 })).toBe(false);
      expect(isRightClick({ button: null })).toBe(false);
      expect(isRightClick({ button: undefined })).toBe(false);
      expect(isRightClick({})).toBe(false);
    });
  });

  //
  // Handsontable.dom.isTouchEvent
  //
  describe('isTouchEvent', () => {
    it('should return true for valid touch events', () => {
      expect(isTouchEvent(new TouchEvent('touchstart'))).toBe(true);
    });

    it('should return false for invalid touch events', () => {
      expect(isTouchEvent(new MouseEvent('mousedown'))).toBe(false);
    });

    it('should return false if TouchEvent is not supported', () => {
      const OriginalTouchEvent = window.TouchEvent;

      window.TouchEvent = undefined;

      expect(isTouchEvent(new OriginalTouchEvent('touchstart'))).toBe(false);

      window.TouchEvent = OriginalTouchEvent;
    });
  });
});
