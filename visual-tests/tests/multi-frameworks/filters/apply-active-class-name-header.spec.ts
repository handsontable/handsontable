import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks if active class is applied on the filtered column header: the capture shows the header after a
 * condition filter is applied from its dropdown menu. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Enter'); // open the filter
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter'); // select the filter
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Enter'); // apply the filter

  // take a screenshot of the dropdown menu
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
