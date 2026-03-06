import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

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
  const table = await tablePage.locator(helpers.selectors.mainTable);

  // get third row header position and size
  const cell = await selectCell(2, 0, table, 'th');
  const THboundingBox = await cell.boundingBox();

  // hover over third row header bottom line
  await tablePage.mouse.move(
    THboundingBox!.x + (THboundingBox!.width / 2),
    THboundingBox!.y + THboundingBox!.height - 3
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // click third row header bottom line
  await tablePage.mouse.down();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
