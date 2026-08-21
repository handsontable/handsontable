import {
  getFirstTouchPoint,
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
   * Builds an event carrying the given touch list.
   *
   * The list is attached as a plain property because jsdom does not implement `Touch` - which is
   * also the case the property-based check exists for.
   *
   * @param {Array} touches The touch points to attach.
   * @returns {Event} The event.
   */
  function eventWithTouches(touches: { clientX: number; clientY: number }[]): Event {
    const event = new Event('touchmove');

    Object.defineProperty(event, 'touches', { value: touches });

    return event;
  }

  //
  // Handsontable.dom.hasTouchList
  //
  describe('hasTouchList', () => {
    it('should return true for an event carrying a touch list', () => {
      expect(hasTouchList(eventWithTouches([{ clientX: 1, clientY: 2 }]))).toBe(true);
    });

    it('should return true for an event carrying an empty touch list', () => {
      expect(hasTouchList(eventWithTouches([]))).toBe(true);
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
  // Handsontable.dom.getFirstTouchPoint
  //
  describe('getFirstTouchPoint', () => {
    it('should return the coordinates of the first touch point', () => {
      expect(getFirstTouchPoint(eventWithTouches([{ clientX: 120, clientY: 340 }])))
        .toEqual({ clientX: 120, clientY: 340 });
    });

    it('should ignore every touch point after the first one', () => {
      const event = eventWithTouches([
        { clientX: 10, clientY: 20 },
        { clientX: 90, clientY: 80 },
      ]);

      expect(getFirstTouchPoint(event)).toEqual({ clientX: 10, clientY: 20 });
    });

    it('should return null for an empty touch list, as carried by touchend', () => {
      expect(getFirstTouchPoint(eventWithTouches([]))).toBe(null);
    });

    it('should return null for an event that carries no touch list', () => {
      expect(getFirstTouchPoint(new MouseEvent('mousemove', { clientX: 5, clientY: 5 }))).toBe(null);
    });
  });
});
