import { test, expect } from '../../src/test-runner';
import {
  selectCell,
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu,
} from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

test('Copy between tables', async({ goto, tablePage, browserName }) => {
  test.skip(browserName !== 'chromium', 'This test runs only on Chrome');

  await goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop .ht-root-wrapper > .ht-grid > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom .ht-root-wrapper > .ht-grid > .handsontable');

  await tableTop.waitFor();
  await tableBottom.waitFor();

  await selectColumnHeaderByNameAndOpenMenu('OS', tableTop);
  await selectFromContextMenu('Read only');
  await (await selectCell(2, 4, tableBottom)).click();
  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  const copiedText = await tablePage.evaluate(() => navigator.clipboard.readText());
  const tableTopCellNotReadOnly = (await selectCell(2, 4, tableTop));

  await tableTopCellNotReadOnly.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await tableTopCellNotReadOnly.innerText()).toBe(copiedText);

  const tableTopCellReadOnly = (await selectCell(2, 10, tableTop));

  await tableTopCellReadOnly.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await tableTopCellReadOnly.innerText()).not.toBe(copiedText);
});

test('Copy/Paste/Cut inside table', async({ goto, tablePage, browserName }) => {
  test.skip(browserName !== 'chromium', 'This test runs only on Chrome');

  await goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop .ht-root-wrapper > .ht-grid > .handsontable');

  await tableTop.waitFor();

  const sourceCell = await selectCell(2, 2, tableTop);

  await sourceCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  const copiedText = await tablePage.evaluate(() => navigator.clipboard.readText());
  const targetCell = await selectCell(3, 3, tableTop);

  await targetCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await targetCell.innerText()).toBe(copiedText);
  expect(copiedText).toBe('Subscription');

  const cutCell = await selectCell(4, 4, tableTop);

  await cutCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+x`);

  expect(await cutCell.innerText()).toBe('');
});

test('Copy and paste data in a scrolled table', async({ goto, tablePage, browserName }) => {
  test.skip(browserName !== 'chromium', 'This test runs only on Chrome');

  await goto('/large-dataset-demo');

  const table = tablePage.locator('#root .ht-root-wrapper > .ht-grid > .handsontable');
  const scrollableElement = table.locator('.ht_master .wtHolder');
  const sourceCell = await selectCell(1, 1, table);

  await tablePage.keyboard.down('Shift');
  await sourceCell.click();

  await scrollableElement.evaluate((element) => {
    element.scrollTo(10000, 10000); // Large values to ensure scrolling to the end
  });

  await tablePage.waitForTimeout(20);

  const endCell = table.locator('.ht_master table tr:last-of-type > td:last-of-type');

  await endCell.click();
  await tablePage.keyboard.up('Shift');

  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  await scrollableElement.evaluate((element) => {
    element.scrollTo(0, 0);
  });

  await tablePage.waitForTimeout(20);

  const targetCell = await selectCell(0, 0, table);

  await targetCell.click();

  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  expect(await targetCell.innerText()).toBe('B2');
});

test('Cut and paste data in a scrolled table', async({ goto, tablePage, browserName }) => {
  test.skip(browserName !== 'chromium', 'This test runs only on Chrome');

  await goto('/large-dataset-demo');

  const table = tablePage.locator('#root .ht-root-wrapper > .ht-grid > .handsontable');
  const scrollableElement = table.locator('.ht_master .wtHolder');
  let sourceCell = await selectCell(1, 1, table);

  await tablePage.keyboard.down('Shift');
  await sourceCell.click();

  await scrollableElement.evaluate((element) => {
    element.scrollTo(10000, 10000); // Large values to ensure scrolling to the end
  });

  await tablePage.waitForTimeout(20);

  const endCell = table.locator('.ht_master table tr:last-of-type > td:last-of-type');

  await endCell.click();
  await tablePage.keyboard.up('Shift');

  await tablePage.keyboard.press(`${helpers.modifier}+x`);

  await scrollableElement.evaluate((element) => {
    element.scrollTo(0, 0);
  });

  await tablePage.waitForTimeout(20);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  sourceCell = await selectCell(1, 1, table);
  expect(await sourceCell.innerText()).toBe('');

  const targetCell = await selectCell(0, 0, table);

  await targetCell.click();

  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  expect(await targetCell.innerText()).toBe('B2');
});

test('Copy/Paste/Cut table initialized as web component', async({ goto, tablePage, browserName }) => {
  test.skip(browserName !== 'chromium', 'This test runs only on Chrome');

  await goto('/web-component-demo');

  const tableTop = tablePage.locator('#root > hot-table');

  await tableTop.waitFor();

  const sourceCell = await selectCell(1, 1);

  await sourceCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  const copiedText = await tablePage.evaluate(() => navigator.clipboard.readText());
  const targetCell = await selectCell(3, 1);

  await targetCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await targetCell.innerText()).toBe(copiedText);
  expect(copiedText).toBe('Cycling Cap');

  const cutCell = await selectCell(5, 1);

  await cutCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+x`);

  expect(await cutCell.innerText()).toBe('');
});
