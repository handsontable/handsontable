import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks whether ENTER does not close the menu at inappropriate moments. ENTER should accept the
 * filtering action only when the "Ok" button is focused.
 */
test(__filename, async({ tablePage }) => {
  const cell = await selectCell(0, 1);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Enter');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter'); // "Begins with"
  await tablePage.waitForTimeout(100);
  await tablePage.keyboard.type('Road', { delay: 100 });

  await tablePage.keyboard.press('Enter'); // "Enter" here should do nothing

  // take a screenshot of the entered filter data
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Enter'); // "Enter" here should do nothing

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Enter'); // "Enter" here should do nothing

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab'); // focus search input
  await tablePage.keyboard.press('Enter'); // "Enter" here should do nothing

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab'); // focus "Ok" button
  await tablePage.keyboard.press('Enter'); // "Enter" here accepts the filtering action

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
