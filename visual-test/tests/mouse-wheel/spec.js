import screenshotFilePath from '../../imports/screenshotFilePath';

const { test, expect } = require('@playwright/test');

test('test mouse wheel', async({ page }, workerInfo) => {
  await page.goto('https://handsontable.com/demo');
  await expect(page).toHaveTitle('Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.');

  const table = page.locator('#hot');

  await table.waitFor();

  const wtSpreader = await table.locator('> .ht_master > .wtHolder > .wtHider .wtSpreader');
  const tbody = await wtSpreader.locator('table tbody');
  const tbodyCoordinates = await tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  await table.waitFor();
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: screenshotFilePath('1', workerInfo) });

  await page.mouse.move(
    tbodyCoordinates.x + (tbodyCoordinates.width / 2), tbodyCoordinates.y + (tbodyCoordinates.height / 2)
  );
  await page.mouse.wheel(0, 270);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: screenshotFilePath('2', workerInfo) });
  await page.mouse.wheel(0, -270);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: screenshotFilePath('3', workerInfo) });
});
