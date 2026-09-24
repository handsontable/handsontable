import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * Checks where Shift+Tab moves the focus into, through, and out of the grid with `navigableHeaders` on: the
 * last cell of the last row selected, then that row's row header after nine more presses, then no selection
 * once the focus leaves. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  await tablePage.locator('html').press('Shift+Tab');

  // The table should be focused and the last cell of the last row should be selected
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');

  // The table should be still focused and the row header of the last row should be selected
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.locator('html').press('Shift+Tab');

  // The table should be unfocused and there should be no selection
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
