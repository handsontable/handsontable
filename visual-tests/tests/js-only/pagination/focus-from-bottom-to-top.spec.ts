import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/pagination-demo')
      .getFullUrl()
  );

  const inputBottom = tablePage.locator('input[name="inputBottom"]');

  await inputBottom.focus();

  await tablePage.keyboard.press('Shift+Tab'); // focus is on the "go to last page" button

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab'); // focus is on the "go to next page" button
  await tablePage.keyboard.press('Enter'); // trigger the next page

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab'); // focus is on the "go to prev page" button

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab'); // focus is on the "go to first page" button

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab'); // focus is on the page size section

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab'); // handsontable is focused

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
