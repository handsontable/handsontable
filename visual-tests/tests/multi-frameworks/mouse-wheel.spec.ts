import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

test(__filename, async({ tablePage }) => {
  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);

  const tbodyCoordinates = await tbody.boundingBox();

  await tablePage.mouse.move(
    tbodyCoordinates!.x + (tbodyCoordinates!.width / 2),
    tbodyCoordinates!.y + (tbodyCoordinates!.height / 2)
  );

  await tablePage.mouse.wheel(0, 270);
  await tablePage.waitForTimeout(1000);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
  await tablePage.mouse.wheel(0, -270);
  await tablePage.waitForTimeout(1000);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
