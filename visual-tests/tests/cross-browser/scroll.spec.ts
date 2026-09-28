import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
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
   * on this demo route. One capture per route in `urls`, in each browser. Owned by DEV-2981.
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
    // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
    await tablePage.waitForTimeout(500);

    await tablePage.mouse.wheel(500, 1000);
    // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
    await tablePage.waitForTimeout(500);
    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
