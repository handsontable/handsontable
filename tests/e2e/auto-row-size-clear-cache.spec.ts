import { test, expect } from '../fixtures/test';
import { AutoRowSizeClearCachePage } from '../fixtures/pages/AutoRowSizeClearCachePage';

/**
 * DEV-2812. `AutoRowSize#clearCache()` used to empty every measured row height and schedule nothing
 * to replace them. Rows are only measured during a render, and a render measures just the visible
 * band, so every row below the fold stayed unmeasured and fell back to the default height.
 *
 * That is invisible until a wide wrapping column scrolls into view. The data cell then renders at
 * its content height - a cell never renders shorter than its own text - while the row header, with
 * nothing to push it taller, keeps the default. The two tables drift apart, and because each row's
 * gap adds to the ones below it, the offset grows the further down the grid you look.
 *
 * All of this is content-driven geometry, which reads as zero in jsdom, so it can only be checked
 * in a real browser.
 */
test.describe('AutoRowSize after clearCache()', () => {
  let grid: AutoRowSizeClearCachePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoRowSizeClearCachePage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the row headers aligned with their rows when scrolled sideways', async() => {
    await grid.wipeRowHeightCache();

    // Down first, so the rows under test are ones that were never on screen during the render that
    // followed the wipe, then sideways to bring the wrapping columns in. Scrolling straight down
    // never showed the defect: at rest the visible columns are narrow enough that the default
    // height happens to be right.
    await grid.scrollTo(600, 0);
    await grid.scrollTo(600, 700);

    // Asserted as a small tolerance rather than exactly 0: borders and box-model rounding move a
    // row by a fraction of a pixel across themes. The defect is nothing like that size - it drops a
    // whole wrapped line, which measured 40px per row and over 500px cumulatively.
    expect(await grid.worstRowHeaderDrift()).toBeLessThanOrEqual(1);
  });

  test('measures the rows it renders after the cache is dropped', async() => {
    await grid.wipeRowHeightCache();
    await grid.scrollTo(600, 700);

    // The cause, asserted directly. Without the replacement pass the plugin re-measured only the
    // band that was visible at the moment of the wipe, so every row scrolled to afterwards stayed
    // `null` in the height map and silently used the default.
    expect(await grid.unmeasuredRenderedRows()).toBe(0);
  });

  test('still lines up on a grid whose cache was never touched', async() => {
    // The control. A grid nobody wipes has always been correct, and it must stay that way - the
    // fix adds work to the render path, so this is what would catch it breaking the ordinary case.
    await grid.scrollTo(600, 700);

    expect(await grid.worstRowHeaderDrift()).toBeLessThanOrEqual(1);
  });
});
