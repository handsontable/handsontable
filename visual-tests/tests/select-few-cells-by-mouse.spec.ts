import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);
  const cell = tbody.locator(helpers.findCell({ row: 2, cell: 2, cellType: 'td' }));
  const cellCoordinates = await cell.boundingBox();

  await page.mouse.move(
    cellCoordinates!.x + (cellCoordinates!.width / 2),
    cellCoordinates!.y + (cellCoordinates!.height / 2)
  );
  await page.mouse.down();
  await page.mouse.move(
    cellCoordinates!.x + (cellCoordinates!.width / 2) + 100,
    cellCoordinates!.y + (cellCoordinates!.height / 2) + 100
  );
  await page.mouse.up();
  await page.screenshot({ path: helpers.screenshotPath() });
});
