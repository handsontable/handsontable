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

// leg-declarations: ignore geometry-helper -- measureHorizontalScrollLayouts() reads scrollWidth only to size its scroll steps; the spec compares counts of draws and forced layouts
test.describe('CustomBorders scrolling cost', () => {
  // `Performance.getMetrics` is a Chromium DevTools call; an untagged spec runs on Chromium only.
  test('a horizontal scroll forces no more layouts with 2,100 borders than without', async({ page, theme, bundle }) => {
    const lab = new CustomBordersLabPage(page, theme, bundle);

    await lab.goto();
    await lab.createGrid({ dataRows: ROWS, dataCols: COLS, height: 420 });

    const withoutBorders = await lab.measureHorizontalScrollLayouts(SCROLL_STEPS);

    await lab.createGrid({ dataRows: ROWS, dataCols: COLS, height: 420, customBorders: everyCellBorders() });

    const withBorders = await lab.measureHorizontalScrollLayouts(SCROLL_STEPS);

    // The scroll must really have drawn, or both counts are vacuously small. A slow runner may fold
    // several steps into one frame, so the bar is a quarter of the steps, not most of them.
    expect(withoutBorders.renders).toBeGreaterThanOrEqual(SCROLL_STEPS / 4);
    expect(withBorders.renders).toBeGreaterThanOrEqual(SCROLL_STEPS / 4);
    // Every visible border used to read cell geometry right after the previous one wrote its
    // styles, which cost one forced layout per border and draw (about 180 per draw here).
    expect(withBorders.layouts / withBorders.renders)
      .toBeLessThanOrEqual(withoutBorders.layouts / withoutBorders.renders + 5);
    // The borders must still be drawn.
    expect(await lab.countVisibleCustomBorders()).toBeGreaterThan(0);
  });

  test('measuring the borders writes nothing to the DOM', async({ page, theme, bundle }) => {
    const lab = new CustomBordersLabPage(page, theme, bundle);

    await lab.goto();
    // Frozen panes put the cell (0, 0) in the clones, which `createGrid` does not wait for.
    await page.evaluate(settings => (window as any).createHot(settings), {
      dataRows: ROWS,
      dataCols: COLS,
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      customBorders: everyCellBorders().slice(0, 300),
    });
    await page.evaluate(() => (window as any).hot.selectCells([[3, 3, 6, 6]]));

    const layers = await lab.measureBordersAndCountWrites();

    // The focus layer, the area layer and the custom borders in the viewport all measure something.
    expect(layers.filter(layer => layer.measured).length).toBeGreaterThan(2);
    expect(layers.map(layer => layer.mutations)).toEqual(layers.map(() => 0));
  });
});
