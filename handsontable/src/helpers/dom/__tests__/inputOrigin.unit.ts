import { isTouchSynthesizedMouseEvent } from 'handsontable/helpers/dom/inputOrigin';

describe('inputOrigin helper', () => {
  describe('isTouchSynthesizedMouseEvent', () => {
    it('should return true when the browser reports the event originates from a touch device', () => {
      expect(isTouchSynthesizedMouseEvent({ sourceCapabilities: { firesTouchEvents: true } })).toBe(true);
    });

    it('should return false when the browser reports a non-touch input device', () => {
      expect(isTouchSynthesizedMouseEvent({ sourceCapabilities: { firesTouchEvents: false } })).toBe(false);
    });

    it('should return undefined when the browser does not expose the information', () => {
      expect(isTouchSynthesizedMouseEvent({})).toBeUndefined();
      expect(isTouchSynthesizedMouseEvent({ sourceCapabilities: null })).toBeUndefined();
      expect(isTouchSynthesizedMouseEvent({ sourceCapabilities: undefined })).toBeUndefined();
    });
  });
});
