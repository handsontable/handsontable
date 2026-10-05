import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

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
   * on this demo route: the scrollbars, the overlays clipped against them and the cells they reveal,
   * which Chromium, Firefox and WebKit each draw their own way. One capture per route in `urls`, in each
   * browser, after asserting the cell took the focus and the viewport left its top. Each route is a
   * different overlay and virtualization layout, so no two of these captures stand in for each other.
   * Owned by DEV-3257.
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
    // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
    await tablePage.waitForTimeout(500);

    await tablePage.mouse.wheel(500, 1000);
    // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
    await tablePage.waitForTimeout(500);

    await expect.poll(async() => table.locator('.ht_master .wtHolder').evaluate(holder => holder.scrollTop))
      .toBeGreaterThan(0);

    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
