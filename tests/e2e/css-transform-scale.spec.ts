import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SharedDemoGridPage, type LayoutMetrics } from '../fixtures/pages/SharedDemoGridPage';

/**
 * A grid built under a CSS `transform: scale()` lays out exactly as it does unscaled: the same holder
 * size, the same rendered rows, and row and column headers as tall and as wide as the rows and columns
 * they label. The transform only scales the painted result. #10482 fixed a holder sized from the
 * transformed box (`getBoundingClientRect()`), which shrank the grid by the scale, and #11990 a row
 * height read the same way, which put the overlays' headers out of line with the rows.
 *
 * The `render-in-css-transform` visual spec, added with #10482, scaled `<body>` to 0.75 and 0.5 and
 * captured each, on every js variant and the three wrappers. It applied the transform AFTER the grid had
 * laid out, and nothing renders the grid on a transform change, so the captures showed the browser
 * scaling a finished layout and never ran the code either fix touched. The fixture here applies the
 * transform before it builds the grid, and every size is compared with the same grid built unscaled.
 */
test.describe('a grid built under a CSS scale', { tag: CROSS_BROWSER_TAG }, () => {
  const ROWS = 10;

  /**
   * Opens the fixture and reads its layout.
   *
   * @param {SharedDemoGridPage} grid The page object.
   * @param {'none' | 'scale-0.75' | 'scale-0.5'} transform The transform.
   * @returns {Promise<LayoutMetrics>}
   */
  async function layoutUnder(grid: SharedDemoGridPage, transform: 'none' | 'scale-0.75' | 'scale-0.5') {
    await grid.goto(transform);

    return grid.layoutMetrics(ROWS);
  }

  for (const [transform, scale] of [['scale-0.75', 0.75], ['scale-0.5', 0.5]] as const) {
    test(`lays out at ${scale} exactly as it does unscaled`, async({ page, theme, bundle }) => {
      const grid = new SharedDemoGridPage(page, theme, bundle);
      const unscaled = await layoutUnder(grid, 'none');
      const scaled = await layoutUnder(grid, transform);

      // The premise: the transform reached the grid, and the unscaled grid is the reference.
      expect(unscaled.scale).toBeCloseTo(1, 3);
      expect(scaled.scale).toBeCloseTo(scale, 3);

      // Every size is a layout size, so it matches the unscaled grid exactly.
      expect({ ...scaled, scale: 1 }).toEqual(unscaled);
      // And the headers line up with what they label, which is what the captures showed.
      expect(scaled.rowHeaderHeights).toEqual(scaled.rowHeights);
      expect(scaled.columnHeaderWidths).toEqual(scaled.columnWidths);
    });
  }
});
