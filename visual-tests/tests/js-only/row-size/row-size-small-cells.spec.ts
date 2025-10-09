import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/row-size-demo')
      .setPageParams({ smallcells: true })
      .getFullUrl()
  );

  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);

  const tbodyCoordinates = await tbody.boundingBox();

  await tablePage.mouse.move(
    tbodyCoordinates!.x + (tbodyCoordinates!.width / 2),
    tbodyCoordinates!.y + (tbodyCoordinates!.height / 2)
  );

  await tablePage.mouse.wheel(0, 500);

  await tablePage.waitForTimeout(500);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
