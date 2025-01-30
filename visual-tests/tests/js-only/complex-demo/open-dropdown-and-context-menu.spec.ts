import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  openHeaderDropdownMenu,
  openContextMenu,
  selectCell,
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
  await openHeaderDropdownMenu(4);
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  const cell = await selectCell(5, 1);

  await openContextMenu(cell);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
