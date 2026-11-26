import { test, expect, THEMES_TAG } from '../fixtures/test';
import { RowHeightDeviceScalePage } from '../fixtures/pages/RowHeightDeviceScalePage';

/**
 * GitHub #14330: the row-move guideline sat off the row border at 80% browser zoom on Windows Chrome.
 *
 * The reporter opens the page at 100% and then zooms out. Below 100% a browser cannot paint the cells'
 * 1px bottom border thinner than a device pixel, so every row renders 0.25px taller at 80%. The grid
 * decided once, when it was built, whether to size rows from that inflated height. A grid built at 100%
 * kept the declared height after the zoom, and everything that sums row heights fell 0.25px short per
 * row: the guideline, the grid's scroll range, the row-header clone. A grid built already zoomed out
 * was right (#6280, `row-height-device-scale.spec.ts`), which is why the demo looked fine to anyone who
 * loaded it at 80%.
 *
 * The zoom here is CSS `zoom` on the root element, applied after the grid is built, followed by the
 * `resize` a browser dispatches on a zoom change. It inflates the border the same way page zoom does
 * (see the fixture), and it is the only lever the Playwright projects have: a launch flag needs
 * `viewport: null`, which every project's device profile forbids.
 *
 * The assertions are about drift, not about the absolute gap. Each row at 80% still sits a fraction of
 * a pixel off the browser's own sub-pixel snapping, and that part is a constant. What the defect added
 * grew by 0.25px with every row, about 10px by row 40.
 */
const NEAR_ROW = 5;
const FAR_ROW = 40;

test.describe('row move guideline after the browser zoom changed', { tag: THEMES_TAG }, () => {
  let grid: RowHeightDeviceScalePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new RowHeightDeviceScalePage(page, theme, bundle);
    await grid.gotoWithRowMove({ zoomAfter: 0.8 });
  });

  test('the zoom applied after the grid was built inflated the cell border', async () => {
    // Guards every assertion below: with no inflated border there is no defect to catch.
    expect(await grid.cellBorderBottomWidth()).toBeGreaterThan(1);
  });

  test('the guideline stays on the row border however far down the row is', async () => {
    const [near, far] = await grid.guidelineGaps(0, [NEAR_ROW, FAR_ROW]);

    expect(Math.abs(near)).toBeLessThan(1);
    expect(Math.abs(far)).toBeLessThan(1);
    expect(Math.abs(far - near)).toBeLessThan(0.5);
  });

  test('the grid is as tall as the rows it holds', async () => {
    expect(Math.abs(await grid.rowOverflowBelowGrid())).toBeLessThanOrEqual(1);
    expect(await grid.rowHeaderClipped()).toBeLessThanOrEqual(1);
  });
});

test.describe('row move guideline in a grid built zoomed out: the control', { tag: THEMES_TAG }, () => {
  test('the guideline stays on the row border however far down the row is', async ({ page, theme, bundle }) => {
    const grid = new RowHeightDeviceScalePage(page, theme, bundle);

    await grid.gotoWithRowMove({ zoom: 0.8 });

    expect(await grid.cellBorderBottomWidth()).toBeGreaterThan(1);

    const [near, far] = await grid.guidelineGaps(0, [NEAR_ROW, FAR_ROW]);

    expect(Math.abs(near)).toBeLessThan(1);
    expect(Math.abs(far)).toBeLessThan(1);
    expect(Math.abs(far - near)).toBeLessThan(0.5);
  });
});

test.describe('row move guideline at 100%: the control', { tag: THEMES_TAG }, () => {
  test('the guideline is on the row border at every row', async ({ page, theme, bundle }) => {
    const grid = new RowHeightDeviceScalePage(page, theme, bundle);

    await grid.gotoWithRowMove();

    expect(await grid.cellBorderBottomWidth()).toBe(1);

    const [near, far] = await grid.guidelineGaps(0, [NEAR_ROW, FAR_ROW]);

    expect(Math.abs(near)).toBeLessThan(0.5);
    expect(Math.abs(far)).toBeLessThan(0.5);
  });
});

test.describe('row move guideline after a zoom made while the grid was hidden', { tag: THEMES_TAG }, () => {
  test('the grid is measured once it is shown, not while it renders no row', async ({ page, theme, bundle }) => {
    const grid = new RowHeightDeviceScalePage(page, theme, bundle);

    await grid.gotoWithRowMove();
    await grid.zoomWhileHidden(0.8);

    expect(await grid.cellBorderBottomWidth()).toBeGreaterThan(1);
    expect(Math.abs(await grid.rowOverflowBelowGrid())).toBeLessThanOrEqual(1);

    const [near, far] = await grid.guidelineGaps(0, [NEAR_ROW, FAR_ROW]);

    expect(Math.abs(near)).toBeLessThan(1);
    expect(Math.abs(far)).toBeLessThan(1);
    expect(Math.abs(far - near)).toBeLessThan(0.5);
  });
});
