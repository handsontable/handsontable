import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ page, goto, tablePage }) => {

  await page.setViewportSize({ width: 200, height: 400 });

  await goto(
    helpers
      .setBaseUrl('/wrapper-demo')
      .setPageParams({ preventOverflow: true })
      .getFullUrl()
  );

  await tablePage.mouse.move(50, 50);
  await tablePage.mouse.wheel(100, 0);
  await tablePage.waitForTimeout(500);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
