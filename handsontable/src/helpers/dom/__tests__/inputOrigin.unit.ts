import { getMouseEventTouchOrigin } from 'handsontable/helpers/dom/inputOrigin';

describe('inputOrigin helper', () => {
  describe('getMouseEventTouchOrigin', () => {
    it('should return true when the browser reports the event originates from a touch device', () => {
      expect(getMouseEventTouchOrigin({ sourceCapabilities: { firesTouchEvents: true } })).toBe(true);
    });

    it('should return false when the browser reports a non-touch input device', () => {
      expect(getMouseEventTouchOrigin({ sourceCapabilities: { firesTouchEvents: false } })).toBe(false);
    });

    it('should return undefined when the browser does not expose the information', () => {
      expect(getMouseEventTouchOrigin({})).toBeUndefined();
      expect(getMouseEventTouchOrigin({ sourceCapabilities: null })).toBeUndefined();
      expect(getMouseEventTouchOrigin({ sourceCapabilities: undefined })).toBeUndefined();
    });
  });
});
