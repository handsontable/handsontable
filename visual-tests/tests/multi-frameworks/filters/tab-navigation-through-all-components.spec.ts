import { test, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell, tryToEscapeFromTheComponentsFocus } from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1280, height: 980 });
});

/**
 * Checks whether pressing the Tab moves the focus forward within the filter's components.
 */
test(__filename, async({ tablePage }) => {
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  // take a screenshot of the dropdown menu without selecting any of the item
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Enter');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter'); // select and accept "Is between" option (9 presses: None→Is empty→Is not empty→Is equal to→Is not equal to→Before→Before or equal to→After→After or equal to→Is between)
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused input after selecting and accepting the condition option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the second focused input
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused radio input (And)
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused radio input (Or)
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused second filter's "by condition" component
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Enter');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter'); // select and accept "Is equal" option
  const isEqualValueInput = tablePage
    .getByRole('menuitem').filter({ hasText: 'Is equal to' })
    .getByPlaceholder('Value', { exact: true });

  await expect(isEqualValueInput).toBeFocused();
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused input after selecting and accepting the condition option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');

  // take a screenshot of the focused search input of the "by value" component
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Select all" link
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Clear" link
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Ok" button
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Cancel" button
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');

  // take a screenshot of the focused menu with the last highlighted item
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the dropdown menu where the first filter's component is focused (tab order starts looping from here)
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
