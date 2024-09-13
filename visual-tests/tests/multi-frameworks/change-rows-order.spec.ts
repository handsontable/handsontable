import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

test(__filename, async({ tablePage }) => {
  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const cloneInlineStartTable = table.locator(helpers.selectors.cloneInlineStartTable);
  const cell = cloneInlineStartTable.locator(helpers.findCell({ row: 3, column: 0, cellType: 'th' }));

  // without coordinates, `click()` works in the middle of the element,
  // so in this case, it would deselect the checkbox
  // to avoid it, let's define coordinates inside of the cell, but outside of the checkbox
  await cell.click({ position: { x: 1, y: 1 } });
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  const cellCoordinates = await cell.boundingBox();

  await tablePage.mouse.move(cellCoordinates!.x + 1, cellCoordinates!.y + 1);
  await tablePage.mouse.down();
  await tablePage.mouse.move(cellCoordinates!.x + 1, cellCoordinates!.y - 50);
  await tablePage.mouse.up();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
