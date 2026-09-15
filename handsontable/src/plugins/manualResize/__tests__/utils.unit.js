import {
  COLUMN_SIZE_OPTIONS,
  ROW_SIZE_OPTIONS,
  redeclaresManualSizes,
} from 'handsontable/plugins/manualResize/utils';

describe('manualResize/utils', () => {
  // Issue #4371. Decides whether an `updateSettings` config re-declares the sizes the plugin keeps,
  // which is what discards the sizes produced by dragging. The third argument is the plugin option
  // read from the MERGED settings, not from the config object.
  describe('redeclaresManualSizes', () => {
    it('should report a re-declaration when the size option is given', () => {
      expect(redeclaresManualSizes({ colWidths: [10, 20] }, COLUMN_SIZE_OPTIONS, true)).toBe(true);
      expect(redeclaresManualSizes({ rowHeights: 50 }, ROW_SIZE_OPTIONS, true)).toBe(true);
    });

    it('should not report a re-declaration when the size option is absent', () => {
      expect(redeclaresManualSizes({ colHeaders: true }, COLUMN_SIZE_OPTIONS, true)).toBe(false);
    });

    it('should not report a re-declaration when the size option is explicitly undefined', () => {
      // Matches how `BasePlugin` itself tests a config key for relevance.
      expect(redeclaresManualSizes({ colWidths: undefined }, COLUMN_SIZE_OPTIONS, true)).toBe(false);
    });

    it('should not report a re-declaration when the plugin option states the sizes as an array', () => {
      // The array states the manual sizes, so it is kept. This covers both the array arriving in
      // the same call and one the grid was built with, because the value is read from the merged
      // settings either way.
      expect(redeclaresManualSizes({ colWidths: [10] }, COLUMN_SIZE_OPTIONS, [40, 50])).toBe(false);
    });

    it('should report a re-declaration when the plugin option is a boolean', () => {
      // `true` carries no sizes, so there is nothing to keep.
      expect(redeclaresManualSizes({ colWidths: [10] }, COLUMN_SIZE_OPTIONS, true)).toBe(true);
    });

    it('should not report a re-declaration when the size option is a function', () => {
      // A function states no fixed size, and a framework wrapper rebuilds an inline one on every
      // render, which would discard the stored sizes each time.
      expect(redeclaresManualSizes({ colWidths: () => 100 }, COLUMN_SIZE_OPTIONS, true)).toBe(false);
    });

    it('should report a re-declaration when only the minRowHeights alias is given', () => {
      // `minRowHeights` is documented as an alias for `rowHeights`, and
      // `Core#_getRowHeightFromSettings` reads `rowHeights ?? minRowHeights`.
      expect(redeclaresManualSizes({ minRowHeights: 50 }, ROW_SIZE_OPTIONS, true)).toBe(true);
    });

    it('should report a re-declaration when an empty plugin array presets nothing', () => {
      // `manualRowResize: []` means "enabled, no presets", so it must not suppress the clear.
      expect(redeclaresManualSizes({ rowHeights: 50 }, ROW_SIZE_OPTIONS, [])).toBe(true);
    });

    it('should not report a re-declaration when every given size option is a function', () => {
      expect(redeclaresManualSizes(
        { rowHeights: () => 50, minRowHeights: () => 50 }, ROW_SIZE_OPTIONS, true
      )).toBe(false);
    });

    it('should report a re-declaration when one of the size options is a fixed value', () => {
      expect(redeclaresManualSizes(
        { rowHeights: () => 50, minRowHeights: 40 }, ROW_SIZE_OPTIONS, true
      )).toBe(true);
    });

    it('should not report a re-declaration for a missing config', () => {
      expect(redeclaresManualSizes(undefined, COLUMN_SIZE_OPTIONS, true)).toBe(false);
    });
  });
});
