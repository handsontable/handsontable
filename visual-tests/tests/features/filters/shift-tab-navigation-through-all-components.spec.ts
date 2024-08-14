import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell, tryToEscapeFromTheComponentsFocus } from '../../../src/page-helpers';

/**
 * Checks whether pressing the Shift+Tab moves the focus backward within the filter's components.
 */
test(__filename, async({ tablePage }) => {
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  // take a screenshot of the dropdown menu without selecting any of the item
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Cancel" button
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Ok" button
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Clear" link
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Select all" link
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');

  // take a screenshot of the focused search input of the "by value" component
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');

  // take a screenshot of the focused menu with the last highlighted item
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Cancel" button (tab order starts looping from here)
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
