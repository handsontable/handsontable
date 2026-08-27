import { test, expect } from '../fixtures/test';
import { RowHeightDeviceScalePage } from '../fixtures/pages/RowHeightDeviceScalePage';

/**
 * GitHub #6280: an auto-height grid was shorter than the rows it held whenever the browser
 * rendered below 100% — a zoom level under 100%, or Windows display scaling under 100%.
 *
 * A border cannot be painted thinner than one device pixel, so at 90% the cells' 1px bottom
 * border is reported as 1.111px and every row renders ~0.1px taller than the theme declared.
 * Handsontable summed the declared height, so the shortfall accumulated per row: at the 100
 * rows this fixture builds, the last rows spilled ~10px past the container onto whatever
 * followed the grid, and the row-header clone clipped its own bottom row numbers by the same
 * amount. At 80% it was ~22px, and at 500 rows ~44px.
 *
 * The tolerance is 1px throughout. The remaining error is a constant that does not grow with
 * the row count — a fraction of one device pixel — while the defect grew without bound, so
 * the threshold separates them decisively at any grid size.
 */
test.describe('row height under sub-100% device scaling', () => {
  let grid: RowHeightDeviceScalePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new RowHeightDeviceScalePage(page, theme, bundle);
    await grid.goto(0.9);
  });

  test('the zoom really inflated the cell border', async () => {
    // Guards every assertion below: no inflated border means no defect to catch, and the rest
    // of this file would pass on code that still has it. 1px is the declared width.
    expect(await grid.cellBorderBottomWidth()).toBeGreaterThan(1);
  });

  test('the grid is as tall as the rows it holds', async () => {
    expect(Math.abs(await grid.rowOverflowBelowGrid())).toBeLessThanOrEqual(1);
  });

  test('the row-header clone shows its last row', async () => {
    // The visible half of the defect: pre-fix the clone's scroll box ended above its own last
    // row, so the bottom row numbers were cut off entirely.
    expect(await grid.rowHeaderClipped()).toBeLessThanOrEqual(1);
  });

  test('the grid does not overlap the element below it', async () => {
    // The reporters' symptom, stated the way they stated it: the element under the grid must
    // touch the last row, never be covered by it.
    expect(await grid.gapToElementBelow()).toBeGreaterThanOrEqual(-1);
  });
});

test.describe('row height at 50% — a border that lands on a whole pixel', () => {
  let grid: RowHeightDeviceScalePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new RowHeightDeviceScalePage(page, theme, bundle);
    await grid.goto(0.5);
  });

  test('the border is inflated, but to an exact number of pixels', async () => {
    expect(await grid.cellBorderBottomWidth()).toBe(2);
  });

  test('the grid is as tall as the rows it holds', async () => {
    // At 50% the 1px border resolves to exactly 2px, so rounding it already lands on the right row
    // height and there is nothing to correct. An earlier cut of the fix measured a correction here
    // anyway and added ~0.5px to every row — 49.5px over these 100 rows, a worse defect than the one
    // being fixed, in a range the released build got right.
    expect(Math.abs(await grid.rowOverflowBelowGrid())).toBeLessThanOrEqual(1);
  });
});

test.describe('row height at 100% — the control', () => {
  let grid: RowHeightDeviceScalePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new RowHeightDeviceScalePage(page, theme, bundle);
    await grid.goto(1);
  });

  test('the cell border is not inflated', async () => {
    expect(await grid.cellBorderBottomWidth()).toBe(1);
  });

  test('the grid matches its rows exactly', async () => {
    // Nothing to correct at 100%, and the correction must not invent a correction here: this
    // is the configuration every existing user runs, and it was always exact.
    expect(await grid.rowOverflowBelowGrid()).toBe(0);
    expect(await grid.rowHeaderClipped()).toBe(0);
    expect(await grid.gapToElementBelow()).toBe(0);
  });
});
