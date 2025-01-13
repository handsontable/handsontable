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

  const tableTop = tablePage.locator('#tableTop > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom > .handsontable');

  tableTop.waitFor();
  tableBottom.waitFor();

  await selectColumnHeaderByNameAndOpenMenu('OS', tableTop);
  await selectFromContextMenu('"Read only"');
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

test('Copy inside table', async({ goto, tablePage, browserName }) => {
  test.skip(browserName !== 'chromium', 'This test runs only on Chrome');

  await goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop > .handsontable');

  tableTop.waitFor();

  const sourceCell = await selectCell(2, 2, tableTop);

  await sourceCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  const copiedText = await tablePage.evaluate(() => navigator.clipboard.readText());
  const targetCell = await selectCell(3, 3, tableTop);

  await targetCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await targetCell.innerText()).toBe(copiedText);
});
