import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

/**
 * Checks if active class is applied on the filtered column header with nested headers.
 */
test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/nested-headers-demo')
      .setPageParams({ longNestedHeaders: 'true' })
      .getFullUrl()
  );

  const cell = await selectCell(0, 0);

  await cell.click();
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Enter');

  await tablePage.waitForTimeout(100);

  // take a screenshot of the dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
