import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { RowHeightDeviceScalePage } from '../fixtures/pages/RowHeightDeviceScalePage';

/**
 * The precondition of every geometry assertion below: the rows render a fraction of a pixel taller
 * than a whole-pixel height. Rows on a whole pixel mean there is nothing to correct, and the
 * assertions would pass on the unfixed code.
 *
 * @param grid The page under test.
 */
async function expectRowsInflated(grid: RowHeightDeviceScalePage): Promise<void> {
  const pitch = await grid.rowPitch();

  expect(pitch - Math.floor(pitch)).toBeGreaterThan(0.05);
}

/**
 * An auto-height grid must be as tall as its rows below 100% on every engine, not only on the one whose
 * computed border shows the inflation.
 *
 * Below 100% no device pixel is thin enough to paint the cells' 1px border, so every row renders a
 * fraction taller than the theme declares. Chromium reports that in the computed border (1.111px at
 * 90%), and the grid sizes its rows from a measurement when it sees it. WebKit reads the border as 1px
 * at every CSS zoom level while its rows grow by the same fraction, so the grid kept the declared
 * height there and fell short of its own rows: 8.7px at 90% and 25px at 75% over the fixture's 100
 * rows, with the row-header clone cutting off the last row numbers.
 *
 * `row-height-device-scale.spec.ts` covers the Chromium legs with guards that read the inflated border,
 * which are false on WebKit by design. These tests guard on the row pitch instead, which shows the
 * growth on every engine. 50% and below are not here: the fixture renders every row, and oversized-row
 * measurement already sizes rows a whole pixel taller, so the grid matched its rows there before the
 * fix too; the unit tests of `StylesHandler` pin those levels.
 *
 * The device scale factor is pinned to 1: the WebKit leg emulates a high-density screen by default, and
 * at 1.8 device pixels per CSS pixel the border spans a device pixel and nothing is inflated, so the
 * tests would pass on the unfixed code.
 */
test.describe('row height under CSS zoom on every engine', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test.use({ deviceScaleFactor: 1 });

  for (const zoom of [0.9, 0.75]) {
    test.describe(`at ${zoom * 100}%`, () => {
      let grid: RowHeightDeviceScalePage;

      test.beforeEach(async({ page, theme, bundle }) => {
        grid = new RowHeightDeviceScalePage(page, theme, bundle);
        await grid.goto(zoom);
      });

      test('the grid is as tall as the rows it holds', async() => {
        await expectRowsInflated(grid);
        expect(Math.abs(await grid.rowOverflowBelowGrid())).toBeLessThanOrEqual(1);
      });

      test('the row-header clone shows its last row', async() => {
        await expectRowsInflated(grid);
        expect(await grid.rowHeaderClipped()).toBeLessThanOrEqual(1);
      });

      test('the grid does not overlap the element below it', async() => {
        await expectRowsInflated(grid);
        expect(await grid.gapToElementBelow()).toBeGreaterThanOrEqual(-1);
      });
    });
  }

  test.describe('zoomed out after the grid was built', () => {
    test('the grid is as tall as the rows it holds', async({ page, theme, bundle }) => {
      // The engine whose border reads 1px at every zoom gives no border change to react to, so the
      // grid must notice the zoom itself.
      const grid = new RowHeightDeviceScalePage(page, theme, bundle);

      await grid.gotoWithRowMove({ zoomAfter: 0.9 });
      await expectRowsInflated(grid);
      await expect.poll(async() => Math.abs(await grid.rowOverflowBelowGrid())).toBeLessThanOrEqual(1);
    });
  });

  test.describe('at 100% — the control', () => {
    test('the grid matches its rows exactly', async({ page, theme, bundle }) => {
      const grid = new RowHeightDeviceScalePage(page, theme, bundle);

      await grid.goto(1);

      expect(await grid.rowOverflowBelowGrid()).toBe(0);
      expect(await grid.rowHeaderClipped()).toBe(0);
    });
  });
});

/**
 * WebKit inflates the border under a device scale factor below 1 and reports a ratio of 0.8 as the
 * 32-bit float 0.800000011920929. The bound on what the inflation can add came out at 0.24999998px while
 * the cell rendered exactly 0.25px taller, so the measurement was rejected and the grid fell 25px short
 * over 100 rows. Playwright's device scale factor inflates nothing on Chromium, where these tests hold
 * trivially; the WebKit leg is the one that pins them.
 */
test.describe('row height at a device scale factor of 0.8', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test.use({ deviceScaleFactor: 0.8 });

  let grid: RowHeightDeviceScalePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new RowHeightDeviceScalePage(page, theme, bundle);
    await grid.goto(1);
  });

  test('the grid is as tall as the rows it holds', async({ browserName }) => {
    if (browserName === 'webkit') {
      // The precondition, on the engine where the defect lives: the border is inflated.
      expect(await grid.cellBorderBottomWidth()).toBeGreaterThan(1);
    }

    expect(Math.abs(await grid.rowOverflowBelowGrid())).toBeLessThanOrEqual(1);
    expect(await grid.rowHeaderClipped()).toBeLessThanOrEqual(1);
  });
});
