import { test } from '../../../../../src/test-runner';
import { helpers } from '../../../../../src/helpers';
import {
  doubleClickRelativeToViewport,
} from '../../../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/date-cell-type-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  await doubleClickRelativeToViewport(80, 80, 'left'); // top-left
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape', { delay: 100 }); // closes the editor

  await doubleClickRelativeToViewport(-80, 80, 'left'); // top-right
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape', { delay: 100 }); // closes the editor

  await doubleClickRelativeToViewport(80, -80, 'left'); // bottom-left
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape', { delay: 100 }); // closes the editor

  await doubleClickRelativeToViewport(-80, -80, 'left'); // bottom-right
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
