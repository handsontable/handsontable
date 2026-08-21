import {
  getFirstChangedTouch,
  getTouchPointById,
  hasTouchList,
  isLeftClick,
  isRightClick,
  isTouchEvent,
} from 'handsontable/helpers/dom/event';

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

  /**
   * Builds a touch event, mirroring what a browser reports.
   *
   * The lists are attached as plain properties because jsdom implements neither `Touch` nor
   * `TouchEvent` - which is also the case the property-based check exists for.
   *
   * @param {Array} touches Fingers still on the screen.
   * @param {Array} changedTouches Fingers this event is about.
   * @returns {Event} The event.
   */
  function touchEvent(
    touches: { identifier: number, clientX: number, clientY: number }[],
    changedTouches = touches
  ): Event {
    const event = new Event('touchmove');

    Object.defineProperty(event, 'touches', { value: touches });
    Object.defineProperty(event, 'changedTouches', { value: changedTouches });

    return event;
  }

  const fingerA = { identifier: 7, clientX: 120, clientY: 340 };
  const fingerB = { identifier: 9, clientX: 20, clientY: 30 };

  //
  // Handsontable.dom.hasTouchList
  //
  describe('hasTouchList', () => {
    it('should return true for an event carrying touch lists', () => {
      expect(hasTouchList(touchEvent([fingerA]))).toBe(true);
    });

    it('should return true for an event carrying empty touch lists', () => {
      expect(hasTouchList(touchEvent([]))).toBe(true);
    });

    it('should return true for a real TouchEvent without consulting its constructor', () => {
      // The point of the property check: `instanceof TouchEvent` is false for an event that came
      // from another frame, and desktop Safari has no `TouchEvent` to compare against at all.
      expect(hasTouchList(new TouchEvent('touchstart'))).toBe(true);
    });

    it('should return false for a mouse event', () => {
      expect(hasTouchList(new MouseEvent('mousemove'))).toBe(false);
    });
  });

  //
  // Handsontable.dom.getFirstChangedTouch
  //
  describe('getFirstChangedTouch', () => {
    it('should return the finger the event is about', () => {
      expect(getFirstChangedTouch(touchEvent([fingerA]))).toEqual(fingerA);
    });

    it('should read changedTouches, not the first finger on the screen', () => {
      // A thumb was already resting when this finger landed, so `touches[0]` is the wrong finger.
      expect(getFirstChangedTouch(touchEvent([fingerB, fingerA], [fingerA]))).toEqual(fingerA);
    });

    it('should return null when the event names no changed finger', () => {
      expect(getFirstChangedTouch(touchEvent([fingerA], []))).toBe(null);
    });

    it('should return null for an event that carries no touch lists', () => {
      expect(getFirstChangedTouch(new MouseEvent('mousemove'))).toBe(null);
    });
  });

  //
  // Handsontable.dom.getTouchPointById
  //
  describe('getTouchPointById', () => {
    it('should return the position of the finger with the given identifier', () => {
      expect(getTouchPointById(touchEvent([fingerB, fingerA]), 7))
        .toEqual({ clientX: 120, clientY: 340 });
    });

    it('should return null once that finger has left the screen', () => {
      // How a lift is detected: the finger is gone from `touches` while `changedTouches` names it.
      expect(getTouchPointById(touchEvent([fingerB], [fingerA]), 7)).toBe(null);
    });

    it('should return null when no finger is left', () => {
      expect(getTouchPointById(touchEvent([], [fingerA]), 7)).toBe(null);
    });

    it('should return null for an event that carries no touch lists', () => {
      expect(getTouchPointById(new MouseEvent('mousemove'), 7)).toBe(null);
    });
  });
});
