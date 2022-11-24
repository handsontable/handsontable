import screenshotFilePath from '../../imports/screenshotFilePath';
import { helpers as helper } from '../../imports/helpers';

const { test, expect } = require('@playwright/test');

test('change order of rows', async({ page }, workerInfo) => {
  await page.goto('https://handsontable.com/demo');
  await expect(page).toHaveTitle('Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.');

  const table = page.locator(helper.mainTableSelector);

  await table.waitFor();

  const tbody = table.locator(helper.mainTableSelectorBody);
  const cell = tbody.locator(helper.findCell({ row: 6, cell: 1, cellType: 'th' }));

  // Without coordinates `click` works on the middle of element,
  // what means that in this case it will deselect checkbox.
  // We do not want it, so we should define coordinates out of checkbox, but still in cell
  // - here it can be { 1, 1 }.
  // We have to use `{ force: true }` to force click,
  // cause button is marked by Playwright as `hidden`
  // (it is covered by another layer nad in deafult Playwright won't click it)
  await cell.click({ position: { x: 1, y: 1 }, force: true });
  await page.screenshot({ path: screenshotFilePath('1', workerInfo) });

  const cellCoordinates = await cell.boundingBox();

  await page.mouse.move(cellCoordinates.x + 1, cellCoordinates.y + 1);
  await page.mouse.down();
  await page.mouse.move(cellCoordinates.x + 1, cellCoordinates.y - 50);
  await page.mouse.up();
  await page.screenshot({ path: screenshotFilePath('2', workerInfo) });
});
