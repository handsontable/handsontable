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
    // each row header level with its row. The whole state is polled, never the master's offset alone:
    // an engine can move the master in the wheel's own task while the row headers follow on the next
    // frame's `scroll` event, so a read right after the master moved can still see them behind.
    await expect.poll(async() => grid.scrollState())
      .toMatchObject({ master: 270, inlineStart: 270, top: 0, rowHeaderOffset: 0 });
    expect((await grid.scrollState()).firstFullyVisibleRow).toBeGreaterThan(0);

    // The second capture: scrolled back to the first row.
    await grid.wheelOverBody(-270);

    await expect.poll(async() => grid.scrollState())
      .toEqual({ master: 0, inlineStart: 0, top: 0, firstFullyVisibleRow: 0, rowHeaderOffset: 0 });
  });
});
