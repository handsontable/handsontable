import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SharedDemoGridPage, type LayoutMetrics } from '../fixtures/pages/SharedDemoGridPage';

/**
 * A grid built under a CSS `transform: scale()` lays out exactly as it does unscaled: the same holder
 * size, the same rendered rows, row and column headers as tall and as wide as the rows and columns they
 * label, and a top overlay and corner as tall as the column header they hold. The transform only scales
 * the painted result. #10482 fixed a holder sized from the transformed box (`getBoundingClientRect()`),
 * which shrank the grid by the scale, and #11990 the same read in `outerHeight()`, which cut the top
 * overlay and the corner to the scale (they then clip the column headers once the grid scrolls) and
 * measured a row taller than the default at the scale, so its row header no longer matched it.
 *
 * Every row of this grid is the default height, and a grid of default-height rows measures none of them
 * (`markOversizedRows()` takes its uniform path from the body's `clientHeight`, which a transform does not
 * scale), so the spec writes a two-line value into one cell first: that row is measured, and its row
 * header is the check #11990 needs.
 *
 * The `render-in-css-transform` visual spec, added with #10482, scaled `<body>` to 0.75 and 0.5 and
 * captured each, on every js variant and the three wrappers. It applied the transform AFTER the grid had
 * laid out, and nothing renders the grid on a transform change, so the captures showed the browser
 * scaling a finished layout and never ran the code either fix touched. The fixture here applies the
 * transform before it builds the grid, and every size is compared with the same grid built unscaled.
 */
test.describe('a grid built under a CSS scale', { tag: CROSS_BROWSER_TAG }, () => {
  const ROWS = 10;
  const TALL_ROW = 1;

  /**
   * Opens the fixture and reads its layout.
   *
   * @param {SharedDemoGridPage} grid The page object.
   * @param {'none' | 'scale-0.75' | 'scale-0.5'} transform The transform.
   * @returns {Promise<LayoutMetrics>}
   */
  async function layoutUnder(grid: SharedDemoGridPage, transform: 'none' | 'scale-0.75' | 'scale-0.5') {
    await grid.goto(transform);
    await grid.setDataAt(TALL_ROW, 1, 'line one\nline two');

    return grid.layoutMetrics(ROWS);
  }

  for (const [transform, scale] of [['scale-0.75', 0.75], ['scale-0.5', 0.5]] as const) {
    test(`lays out at ${scale} exactly as it does unscaled`, async({ page, theme, bundle }) => {
      const grid = new SharedDemoGridPage(page, theme, bundle);
      const unscaled = await layoutUnder(grid, 'none');
      const scaled = await layoutUnder(grid, transform);

      // The premise: the transform reached the grid, the unscaled grid is the reference, and the
      // two-line row is taller than the others, so it was measured rather than taken from the default.
      expect(unscaled.scale).toBeCloseTo(1, 3);
      expect(scaled.scale).toBeCloseTo(scale, 3);
      expect(unscaled.rowHeights[TALL_ROW]).toBeGreaterThan(unscaled.rowHeights[0]);

      // Every size is a layout size, so it matches the unscaled grid exactly. The scale is the one
      // reading that differs, and each side's is checked above to its own precision.
      expect({ ...scaled, scale: 1 }).toEqual({ ...unscaled, scale: 1 });
      // And the headers line up with what they label, and the overlays that hold them are tall enough
      // to show them, which is what the captures showed.
      expect(scaled.rowHeaderHeights).toEqual(scaled.rowHeights);
      expect(scaled.columnHeaderWidths).toEqual(scaled.columnWidths);
      expect(scaled.topOverlayHeight).toBeGreaterThanOrEqual(scaled.columnHeaderHeight);
      expect(scaled.cornerOverlayHeight).toBeGreaterThanOrEqual(scaled.columnHeaderHeight);
    });
  }
});
