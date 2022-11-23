import screenshotFilePath from '../../imports/screenshotFilePath';

const { test, expect } = require('@playwright/test');

test('select cells by mouse', async({ page }, workerInfo) => {
  await page.goto('https://handsontable.com/demo');
  await expect(page).toHaveTitle('Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.');

  const table = page.locator('#hot');

  await table.waitFor();

  const wtSpreader = table.locator('> .ht_master > .wtHolder > .wtHider .wtSpreader');
  const tbody = wtSpreader.locator('table tbody');
  // const thead = table.locator('> .ht_clone_top.handsontable > .wtHolder > .wtHider .wtSpreader table thead');
  // const tbodyCoordinates = tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  const cell = tbody.locator('> tr:nth-child(2) > td:nth-child(2)');
  const cellCoordinates = await cell.boundingBox();

  await page.mouse.move(
    cellCoordinates.x + (cellCoordinates.width / 2), cellCoordinates.y + (cellCoordinates.height / 2)
  );
  await page.mouse.down();
  await page.mouse.move(
    cellCoordinates.x + (cellCoordinates.width / 2) + 100, cellCoordinates.y + (cellCoordinates.height / 2) + 100
  );
  await page.mouse.up();
  await page.screenshot({ path: screenshotFilePath('1', workerInfo) });
});
