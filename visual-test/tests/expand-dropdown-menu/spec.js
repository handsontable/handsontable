import snapshotFilePath from '../../imports/snapshotFilePath';

const { test, expect } = require('@playwright/test');

test('expand dropdown menu and clear column', async({ page }, workerInfo) => {
  await page.goto('https://handsontable.com/demo');
  await expect(page).toHaveTitle('Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.');

  const table = page.locator('#hot');

  await table.waitFor();

  // const wtSpreader = table.locator('> .ht_master > .wtHolder > .wtHider .wtSpreader');
  // const tbody = wtSpreader.locator('table tbody');
  const thead = table.locator('> .ht_clone_top.handsontable > .wtHolder > .wtHider .wtSpreader table thead');
  // const tbodyCoordinates = tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  const changeTypeButton = thead.locator('th:nth-child(4) button.changeType');

  await changeTypeButton.click();
  const dropdownMenu = page.locator('.htMenu.htDropdownMenu.handsontable');

  await page.screenshot({ path: snapshotFilePath('1', workerInfo) });
  await dropdownMenu.screenshot({ path: snapshotFilePath('2', workerInfo) });
  await dropdownMenu.locator('"Clear column"').click();
  await page.screenshot({ path: snapshotFilePath('3', workerInfo) });
});
