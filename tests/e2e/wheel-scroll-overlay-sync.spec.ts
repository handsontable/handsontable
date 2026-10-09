import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * The real mouse wheel over the shared `/` grid's body scrolls it down by the wheel's delta and back,
 * with the row headers following the rows and the column headers staying put. Walkontable's own suite
 * drives the wheel on each overlay with synthetic events, and `overlays.spec.ts` scrolls through
 * `scrollTop`; the real wheel on this grid was the `mouse-wheel` visual spec's, two captures each
 * behind a one-second sleep, on every js variant and the three wrappers. Asserted here since DEV-3351.
 */
test.describe('the mouse wheel over the grid body', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('scrolls the rows and their headers together, and back', async() => {
    await grid.wheelOverBody(270);

    // The first capture: scrolled by the wheel's delta, with the row headers on the same offset and
    // each row header level with its row.
    await expect.poll(async() => (await grid.scrollState()).master).toBe(270);

    const down = await grid.scrollState();

    expect(down).toMatchObject({ master: 270, inlineStart: 270, top: 0, rowHeaderOffset: 0 });
    expect(down.firstFullyVisibleRow).toBeGreaterThan(0);

    // The second capture: scrolled back to the first row.
    await grid.wheelOverBody(-270);

    await expect.poll(async() => (await grid.scrollState()).master).toBe(0);
    expect(await grid.scrollState())
      .toEqual({ master: 0, inlineStart: 0, top: 0, firstFullyVisibleRow: 0, rowHeaderOffset: 0 });
  });
});
