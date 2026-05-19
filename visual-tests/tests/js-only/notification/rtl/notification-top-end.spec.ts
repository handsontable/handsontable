import { test } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/notification-demo')
      .setPageParams({ direction: 'rtl', position: 'top-end' })
      .getFullUrl()
  );

  await tablePage.locator('.ht-notification__toast').waitFor();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
