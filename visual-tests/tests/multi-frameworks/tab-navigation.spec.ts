import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * Checks where Tab moves the focus into, through, and out of the grid with `navigableHeaders` on: the first
 * Tab lands on the corner header, nine more walk the column-header row to its last header ("Country"), and
 * the next one leaves the grid with no selection. One capture at each of those three points. Owned by
 * DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  await tablePage.locator('html').press('Tab');

  // The table should be focused and the corner header should be selected (navigableHeaders is on)
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.locator('html').press('Tab');
  await tablePage.locator('html').press('Tab');
  await tablePage.locator('html').press('Tab');
  await tablePage.locator('html').press('Tab');
  await tablePage.locator('html').press('Tab');
  await tablePage.locator('html').press('Tab');
  await tablePage.locator('html').press('Tab');
  await tablePage.locator('html').press('Tab');
  await tablePage.locator('html').press('Tab');

  // The table should be still focused and the last column header should be selected
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.locator('html').press('Tab');

  // The table should be unfocused and there should be no selection
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
