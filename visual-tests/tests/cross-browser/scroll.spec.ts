import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell, waitForWheelScrollToSettle } from '../../src/page-helpers';

const urls = [
  '/cell-types-demo',
  '/arabic-rtl-demo',
  '/custom-style-demo',
  '/merged-cells-demo',
  '/nested-headers-demo',
  '/nested-rows-demo',
];

urls.forEach((url) => {
  /**
   * Checks that scrolling the grid with the mouse wheel from a selected cell renders the scrolled viewport
   * on this demo route: the offset each engine derives from the same wheel delta, and the overlays and
   * cells rendered at that offset, which differ between Chromium, Firefox and WebKit. No scrollbar is in
   * the picture: the fixture waits for the scrollbar clearance band to close before every capture. One
   * capture per route in `urls`, in each browser, after asserting the cell took the focus and the
   * viewport left its top. Each route is a different overlay and virtualization layout, so no two of
   * these captures stand in for each other. Owned by DEV-3257.
   */
  visualTest(`Test scrolling for: ${url}`, {
    themes: [CLASSIC],
    browsers: CROSS_BROWSERS,
    wrappers: [],
  }, async({ goto, tablePage }) => {
    await goto(url);

    const table = tablePage.locator(helpers.selectors.mainTable);

    await table.waitFor();

    const cell = await selectCell(2, 2, table);

    await cell.click();
    await expect(cell).toHaveClass(/(^|\s)current(\s|$)/);
    await tablePage.mouse.wheel(500, 1000);
    await waitForWheelScrollToSettle('scrollTop', table);

    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
