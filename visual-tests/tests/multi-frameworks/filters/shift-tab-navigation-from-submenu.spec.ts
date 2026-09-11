import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks whether pressing the Shift+Tab moves the focus to the filter's components.
 */
test(__filename, async({ tablePage }) => {
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowRight'); // opens the "Alignment" submenu

  // The submenu this spec describes never opens (ArrowDown x3 from the first enabled item stops short of
  // "Alignment", so the frame is the plain menu); there is no state to wait for until the keystrokes are
  // repaired in the consolidation phase.
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: nothing to wait for until the spec is repaired
  await tablePage.waitForTimeout(10);

  // take a screenshot of the submenu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // should close the submenu and focus the last filters component
  await tablePage.keyboard.press('Shift+Tab');

  // take a screenshot of the dropdown menu where the last filter's component is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');

  // take a screenshot of the focused search input element
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
