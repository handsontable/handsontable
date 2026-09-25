import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks that the rows of the row-size demo keep their heights after the grid is scrolled 300 px down with
 * the mouse wheel. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/row-size-demo')
      .getFullUrl()
  );

  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);

  const tbodyCoordinates = await tbody.boundingBox();

  await tablePage.mouse.move(
    tbodyCoordinates!.x + (tbodyCoordinates!.width / 2),
    tbodyCoordinates!.y + (tbodyCoordinates!.height / 2)
  );

  await tablePage.mouse.wheel(0, 300);

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(300);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
