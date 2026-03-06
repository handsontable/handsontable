import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks whether pressing the ESCAPE key within any focused component closes the menu.
 */
test(__filename, async({ tablePage }) => {
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await tablePage.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the search input is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter');

  // take a screenshot of the dropdown menu where the list (handsontable) is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the "Select all" link is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the "Clear" link is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the "Ok" button is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the "Cancel" button is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the menu itself is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
