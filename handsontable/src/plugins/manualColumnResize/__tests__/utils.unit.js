import {
  getElementScaleFactor,
  normalizeVisualDelta,
  redeclaresManualSizes,
  shouldRefreshHandleAfterAutoResize,
  shouldSkipResizeHandlePositioning,
} from 'handsontable/plugins/manualColumnResize/utils';

describe('manualColumnResize/utils', () => {
  describe('getElementScaleFactor', () => {
    it('should return a horizontal scale factor', () => {
      const elementMock = {
        offsetWidth: 200,
        getBoundingClientRect() {
          return {
            width: 100,
            height: 40,
          };
        },
      };

      expect(getElementScaleFactor(elementMock)).toBe(0.5);
    });

    it('should return a vertical scale factor', () => {
      const elementMock = {
        offsetHeight: 100,
        getBoundingClientRect() {
          return {
            width: 120,
            height: 200,
          };
        },
      };

      expect(getElementScaleFactor(elementMock, 'vertical')).toBe(2);
    });

    it('should return 1 when values cannot be used to calculate the factor', () => {
      const elementMock = {
        offsetWidth: 0,
        getBoundingClientRect() {
          return {
            width: 120,
            height: 200,
          };
        },
      };

      expect(getElementScaleFactor(elementMock)).toBe(1);
    });

    it('should return 1 when paint box is at most 1px larger than layout (no transform)', () => {
      const horizontalMock = {
        offsetWidth: 50,
        getBoundingClientRect() {
          return { width: 51, height: 20 };
        },
      };

      expect(getElementScaleFactor(horizontalMock)).toBe(1);

      const verticalMock = {
        offsetHeight: 40,
        getBoundingClientRect() {
          return { width: 10, height: 41 };
        },
      };

      expect(getElementScaleFactor(verticalMock, 'vertical')).toBe(1);
    });

    it('should still return a scale factor when paint box exceeds layout by more than 1px', () => {
      const elementMock = {
        offsetWidth: 50,
        getBoundingClientRect() {
          return { width: 52, height: 20 };
        },
      };

      expect(getElementScaleFactor(elementMock)).toBeCloseTo(1.04);
    });
  });

  describe('normalizeVisualDelta', () => {
    it('should convert delta using the scale factor', () => {
      expect(normalizeVisualDelta(25, 0.5)).toBe(50);
      expect(normalizeVisualDelta(20, 2)).toBe(10);
    });

    it('should return unchanged delta for invalid scale factor', () => {
      expect(normalizeVisualDelta(25, 0)).toBe(25);
      expect(normalizeVisualDelta(25, NaN)).toBe(25);
    });
  });

  describe('shouldSkipResizeHandlePositioning', () => {
    it('should allow positioning for an attached header before double-click auto-size starts', () => {
      expect(shouldSkipResizeHandlePositioning({ parentNode: {} }, 1)).toBe(false);
    });

    it('should skip positioning for a detached header', () => {
      expect(shouldSkipResizeHandlePositioning({ parentNode: null }, 1)).toBe(true);
    });

    it('should skip positioning while double-click auto-size is pending', () => {
      expect(shouldSkipResizeHandlePositioning({ parentNode: {} }, 2)).toBe(true);
    });
  });

  describe('shouldRefreshHandleAfterAutoResize', () => {
    it('should refresh positioning for an attached header after double-click auto-size', () => {
      expect(shouldRefreshHandleAfterAutoResize({ parentNode: {} }, 2)).toBe(true);
    });

    it('should not refresh positioning after a single drag click', () => {
      expect(shouldRefreshHandleAfterAutoResize({ parentNode: {} }, 1)).toBe(false);
    });

    it('should not refresh positioning for a detached or missing header', () => {
      expect(shouldRefreshHandleAfterAutoResize({ parentNode: null }, 2)).toBe(false);
      expect(shouldRefreshHandleAfterAutoResize(null, 2)).toBe(false);
    });
  });

  // Issue #4371. Decides whether an `updateSettings` config re-declares the sizes the plugin keeps,
  // which is what discards the sizes produced by dragging. The third argument is the plugin option
  // read from the MERGED settings, not from the config object.
  describe('redeclaresManualSizes', () => {
    it('should report a re-declaration when the size option is given', () => {
      expect(redeclaresManualSizes({ colWidths: [10, 20] }, 'colWidths', true)).toBe(true);
      expect(redeclaresManualSizes({ rowHeights: 50 }, 'rowHeights', true)).toBe(true);
    });

    it('should not report a re-declaration when the size option is absent', () => {
      expect(redeclaresManualSizes({ colHeaders: true }, 'colWidths', true)).toBe(false);
    });

    it('should not report a re-declaration when the size option is explicitly undefined', () => {
      // Matches how `BasePlugin` itself tests a config key for relevance.
      expect(redeclaresManualSizes({ colWidths: undefined }, 'colWidths', true)).toBe(false);
    });

    it('should not report a re-declaration when the plugin option states the sizes as an array', () => {
      // The array states the manual sizes, so it is kept. This covers both the array arriving in
      // the same call and one the grid was built with, because the value is read from the merged
      // settings either way.
      expect(redeclaresManualSizes({ colWidths: [10] }, 'colWidths', [40, 50])).toBe(false);
    });

    it('should report a re-declaration when the plugin option is a boolean', () => {
      // `true` carries no sizes, so there is nothing to keep.
      expect(redeclaresManualSizes({ colWidths: [10] }, 'colWidths', true)).toBe(true);
    });

    it('should not report a re-declaration when the size option is a function', () => {
      // A function states no fixed size, and a framework wrapper rebuilds an inline one on every
      // render, which would discard the stored sizes each time.
      expect(redeclaresManualSizes({ colWidths: () => 100 }, 'colWidths', true)).toBe(false);
    });

    it('should not report a re-declaration for a missing config', () => {
      expect(redeclaresManualSizes(undefined, 'colWidths', true)).toBe(false);
    });
  });
});
