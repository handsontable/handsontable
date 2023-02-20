import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const cloneInlineStartTable = table.locator(helpers.selectors.cloneInlineStartTable);
  const cell = cloneInlineStartTable.locator(helpers.findCell({ row: 4, cell: 1, cellType: 'th' }));

  // without coordinates, `click()` works in the middle of the element,
  // so in this case, it would deselect the checkbox
  // to avoid it, let's define coordinates inside of the cell, but outside of the checkbox
  await cell.click({ position: { x: 1, y: 1 } });
  await page.screenshot({ path: helpers.screenshotPath() });

  const cellCoordinates = await cell.boundingBox();

  await page.mouse.move(cellCoordinates!.x + 1, cellCoordinates!.y + 1);
  await page.mouse.down();
  await page.mouse.move(cellCoordinates!.x + 1, cellCoordinates!.y - 50);
  await page.mouse.up();
  await page.screenshot({ path: helpers.screenshotPath() });
});
