import {
  insetCssSize,
  overlayScrollbarClearance,
  toggleScrollbarClearance,
} from '../../../src/overlay/scrollbarClearance';
import {
  OVERLAY_SCROLLBAR_CLEARANCE,
  OVERLAY_SCROLLBAR_CLEARANCE_CLASS,
} from '../../../src/overlay/constants';
import * as browser from '../../../../../helpers/browser';

describe('overlay scrollbar clearance', () => {
  describe('overlayScrollbarClearance', () => {
    let isFirefox: jest.SpyInstance;

    beforeEach(() => {
      isFirefox = jest.spyOn(browser, 'isFirefox');
    });

    afterEach(() => {
      isFirefox.mockRestore();
    });

    it('should reserve a strip when the scrollbar measures 0 on Firefox', () => {
      isFirefox.mockReturnValue(true);

      expect(overlayScrollbarClearance(0, true)).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
    });

    it('should reserve nothing when the axis does not scroll', () => {
      isFirefox.mockReturnValue(true);

      expect(overlayScrollbarClearance(0, false)).toBe(0);
    });

    it('should reserve nothing when the scrollbar has real width', () => {
      isFirefox.mockReturnValue(true);

      // A real gutter means the browser already shrank the holder; the classic path handles it.
      expect(overlayScrollbarClearance(15, true)).toBe(0);
    });

    it('should reserve nothing on engines that composite the scrollbar above the overlays', () => {
      // macOS Chrome/Safari and headless Chrome also report 0, but need no clearance.
      isFirefox.mockReturnValue(false);

      expect(overlayScrollbarClearance(0, true)).toBe(0);
    });
  });

  describe('insetCssSize', () => {
    it('should subtract the clearance and keep the unit', () => {
      expect(insetCssSize('340px', 12)).toBe('328px');
    });

    it('should keep sub-pixel sizes', () => {
      expect(insetCssSize('324.5px', 12)).toBe('312.5px');
    });

    it('should return the size untouched when there is no clearance', () => {
      expect(insetCssSize('340px', 0)).toBe('340px');
    });

    it('should leave an empty size empty, so automatic sizing is preserved', () => {
      expect(insetCssSize('', 12)).toBe('');
    });

    it('should never return a negative size', () => {
      expect(insetCssSize('8px', 12)).toBe('0px');
    });
  });

  describe('toggleScrollbarClearance', () => {
    it('should add and remove the class that drives the clearance styles', () => {
      const el = document.createElement('div');

      toggleScrollbarClearance(el, true);
      expect(el.classList.contains(OVERLAY_SCROLLBAR_CLEARANCE_CLASS)).toBe(true);

      toggleScrollbarClearance(el, false);
      expect(el.classList.contains(OVERLAY_SCROLLBAR_CLEARANCE_CLASS)).toBe(false);
    });
  });
});
