import { test, expect } from '../../src/test-runner';
import { selectCell, selectColumnHeaderByNameAndOpenMenu } from '../../src/page-helpers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test(__filename, async({ tablePage }) => {
  await tablePage.goto('/scenario-grid');

  const tableTop = tablePage.locator('#tableTop > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom > .handsontable');

  await selectColumnHeaderByNameAndOpenMenu('System');
  await tablePage.getByText('Read Only').click();
  await (await selectCell(2, 4, tableBottom)).click();
  await tablePage.keyboard.press('Meta+c');
  const copiedText = await tablePage.evaluate(() => navigator.clipboard.readText());

  const tableTopCellNotReadOnly = (await selectCell(2, 4, tableTop));

  await tableTopCellNotReadOnly.click();
  await tablePage.keyboard.press('Meta+v');
  expect(await tableTopCellNotReadOnly.innerText()).toBe(copiedText);

  const tableTopCellReadOnly = (await selectCell(2, 10, tableTop));

  await tableTopCellReadOnly.click();
  await tablePage.keyboard.press('Meta+v');
  expect(await tableTopCellReadOnly.innerText()).not.toBe(copiedText);
});
