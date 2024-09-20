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
