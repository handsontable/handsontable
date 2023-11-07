import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * Checks whether the selection highlights the merged cells correctly.
 */
test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);
  const cellFrom = tbody.locator(helpers.findCell({ row: 3, column: 0, cellType: 'td' }));
  const cellTo = tbody.locator(helpers.findCell({ row: 5, column: 2, cellType: 'td' }));

  const cellFromBox = await cellFrom.boundingBox();
  const cellToBox = await cellTo.boundingBox();

  await page.mouse.move(cellFromBox!.x + 10, cellFromBox!.y + 10);
  await page.mouse.down();
  await page.mouse.move(cellToBox!.x + 10, cellToBox!.y + 10);
  await page.mouse.up();

  await page.keyboard.press('Control+m'); // triggers cell merging

  // take a screenshot of the merged cell
  await page.screenshot({ path: helpers.screenshotPath() });

  const cloneTop = table.locator(helpers.selectors.cloneTopTable);

  await cloneTop
    .locator(helpers.findCell({ row: 0, column: 1, cellType: 'th' }))
    .click({
      position: { x: 1, y: 1 },
      modifiers: [helpers.modifier],
    });
  await cloneTop
    .locator(helpers.findCell({ row: 0, column: 2, cellType: 'th' }))
    .click({
      position: { x: 1, y: 1 },
      modifiers: [helpers.modifier],
    });
  await cloneTop
    .locator(helpers.findCell({ row: 0, column: 3, cellType: 'th' }))
    .click({
      position: { x: 1, y: 1 },
      modifiers: [helpers.modifier],
    });

  // take a screenshot of the selected merged cell (the selection covers the whole merged cell)
  await page.screenshot({ path: helpers.screenshotPath() });

  await cloneTop
    .locator(helpers.findCell({ row: 0, column: 2, cellType: 'th' }))
    .click({
      position: { x: 1, y: 1 },
    });

  // the merged cell should be unselected (the selection does not cover the whole merged cell)
  await page.screenshot({ path: helpers.screenshotPath() });
});
