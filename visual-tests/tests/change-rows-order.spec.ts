import { test } from '../imports/test-runner';
import { helpers } from '../imports/helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const cloneInlineStartTable = table.locator(helpers.selectors.cloneInlineStartTable);
  const cell = cloneInlineStartTable.locator(helpers.findCell({ row: 4, cell: 1, cellType: 'th' }));

  // Without coordinates `click` works on the middle of element,
  // what means that in this case it will deselect checkbox.
  // We do not want it, so we should define coordinates out of checkbox, but still in cell
  // - here it can be { 1, 1 }.

  await cell.click({ position: { x: 1, y: 1 } });
  await page.screenshot({ path: helpers.screenshotPath() });

  const cellCoordinates = await cell.boundingBox();

  await page.mouse.move(cellCoordinates!.x + 1, cellCoordinates!.y + 1);
  await page.mouse.down();
  await page.mouse.move(cellCoordinates!.x + 1, cellCoordinates!.y - 50);
  await page.mouse.up();
  await page.screenshot({ path: helpers.screenshotPath() });
});
