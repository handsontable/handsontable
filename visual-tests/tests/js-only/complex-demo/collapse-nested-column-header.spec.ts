import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  collapseNestedColumn,
} from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );
  await collapseNestedColumn('I');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
