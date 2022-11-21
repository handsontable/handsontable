import snapshotFilePath from '../../imports/snapshotFilePath';
import getModifier from '../../imports/getModifier';

const { test, expect } = require('@playwright/test');

test('copy content from one cell to another, modify cell content', async({ page }, workerInfo) => {
  const modifier = getModifier(workerInfo);

  await page.goto('https://handsontable.com/demo');
  await expect(page).toHaveTitle('Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.');

  const table = page.locator('#hot');

  await table.waitFor();

  const wtSpreader = table.locator('> .ht_master > .wtHolder > .wtHider .wtSpreader');
  const tbody = wtSpreader.locator('table tbody');
  // const tbodyCoordinates = tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  let cell;

  cell = tbody.locator('> tr:nth-child(2) > td:nth-child(3)');

  await cell.click();
  await page.screenshot({ path: snapshotFilePath('1', workerInfo) });
  await page.keyboard.press(`${modifier}+c`);
  await cell.press('Delete');

  cell = tbody.locator('> tr:nth-child(3) > td:nth-child(3)');
  await cell.dblclick();
  await cell.type('-test');

  cell = await tbody.locator('> tr:nth-child(4) > td:nth-child(3)');
  await cell.click();
  await page.keyboard.press('Delete');

  cell = tbody.locator('> tr:nth-child(3) > td:nth-child(3)');
  await cell.click();

  await page.screenshot({ path: snapshotFilePath('2', workerInfo) });
  await page.keyboard.down(`${modifier}`);
  await page.keyboard.press('v');
  await page.keyboard.up(`${modifier}`);
  await page.screenshot({ path: snapshotFilePath('3', workerInfo) });
});
