import snapshotFilePath from '../../imports/snapshotFilePath';

const { test, expect } = require('@playwright/test');

test('change order of rows', async({ page }, workerInfo) => {
  await page.goto('https://handsontable.com/demo');
  await expect(page).toHaveTitle('Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.');

  const table = page.locator('#hot');

  await table.waitFor();

  const wtSpreader = table.locator('> .ht_master > .wtHolder > .wtHider .wtSpreader');
  const tbody = wtSpreader.locator('table tbody');
  // const tbodyCoordinates = tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  const cell = tbody.locator('> tr:nth-child(5) > th:nth-child(1)');

  // Without coordinates `click` works on the middle of element,
  // what means that in this case it will deselect checkbox.
  // We do not want it, so we should define coordinates out of checkbox - here it can be { 1, 1 }.
  // We have to use `{ force: true }` to force click,
  // cause button is marked by Playwright as `hidden` (it is covered by another layer)
  await cell.click({ position: { x: 1, y: 1 }, force: true });
  await page.screenshot({ path: snapshotFilePath('1', workerInfo) });

  const cellCoordinates = await cell.boundingBox();

  await page.mouse.move(cellCoordinates.x + 1, cellCoordinates.y + 1);
  await page.mouse.down();
  await page.mouse.move(cellCoordinates.x + 1, cellCoordinates.y - 50);
  await page.mouse.up();
  await page.screenshot({ path: snapshotFilePath('2', workerInfo) });
});
