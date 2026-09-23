import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Meant to check that Shift+Tab from the "Alignment" submenu closes it and moves the focus to the last
 * filters component. The submenu never opens: the menu opens with its first enabled item ("Clear column")
 * highlighted, so the three ArrowDown presses pass "Alignment" (Read only, Alignment, then back to Clear
 * column) and ArrowRight has nothing to open; the first capture is the plain menu. Two presses reach
 * "Alignment". DEV-2981 repairs the keystrokes or converts the coverage. The two Shift+Tabs after it land
 * on "Cancel" and then "OK". Owned by DEV-2981.
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

  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowRight'); // opens the "Alignment" submenu

  // The submenu this spec describes never opens (ArrowDown x3 from the first enabled item, "Clear column",
  // passes "Alignment" and wraps back, so the frame is the plain menu); there is no state to wait for until
  // the keystrokes are repaired in the consolidation phase.
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: nothing to wait for until the spec is repaired
  await tablePage.waitForTimeout(10);

  // take a screenshot of the submenu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // should close the submenu and focus the last filters component
  await tablePage.keyboard.press('Shift+Tab');

  // take a screenshot of the dropdown menu where the last filter's component is focused
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');

  // take a screenshot of the focused "Ok" button
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
