import { test, expect } from '../fixtures/test';
import { CustomBordersLabPage } from '../fixtures/pages/CustomBordersLabPage';

const ROWS = 30;
const COLS = 70;
const SCROLL_STEPS = 40;

/**
 * One bottom border per cell, the layout from the original report.
 */
function everyCellBorders() {
  const borders = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      borders.push({ row, col, bottom: { width: 1, color: 'rgb(255, 0, 0)' } });
    }
  }

  return borders;
}

test.describe('CustomBorders scrolling cost', () => {
  // `Performance.getMetrics` is a Chromium DevTools call; an untagged spec runs on Chromium only.
  test('a horizontal scroll forces no more layouts with 2,100 borders than without', async({ page, theme, bundle }) => {
    const lab = new CustomBordersLabPage(page, theme, bundle);

    await lab.goto();
    await lab.createGrid({ dataRows: ROWS, dataCols: COLS, height: 420 });

    const withoutBorders = await lab.measureHorizontalScrollLayouts(SCROLL_STEPS);

    await lab.createGrid({ dataRows: ROWS, dataCols: COLS, height: 420, customBorders: everyCellBorders() });

    const withBorders = await lab.measureHorizontalScrollLayouts(SCROLL_STEPS);

    // The scroll must really have drawn, or both counts are vacuously small.
    expect(withoutBorders.renders).toBeGreaterThan(SCROLL_STEPS / 2);
    expect(withBorders.renders).toBeGreaterThan(SCROLL_STEPS / 2);
    // Every visible border used to read cell geometry right after the previous one wrote its
    // styles, which cost one forced layout per border and draw (about 180 per draw here).
    expect(withBorders.layouts / withBorders.renders)
      .toBeLessThanOrEqual(withoutBorders.layouts / withoutBorders.renders + 5);
    // The borders must still be drawn.
    expect(await lab.countVisibleCustomBorders()).toBeGreaterThan(0);
  });
});
