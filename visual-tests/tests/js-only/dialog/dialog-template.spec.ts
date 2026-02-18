import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dialog-demo')
      .setPageParams({ template: 'confirm' })
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // move focus throughout the component and back to the "OK" button
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Shift+Tab');

  // check if the Enter (event) is triggered
  await tablePage.keyboard.press('Enter');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
