import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

test('Test focus on Shift+Tab navigation', async({ goto, tablePage }) => {
  await goto('/basic-two-tables-demo');

  const tableTop = tablePage.locator('#tableTop > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom > .handsontable');

  tableTop.waitFor();
  tableBottom.waitFor();

  await (await selectCell(0, 0, tableTop)).click();
  await tablePage.keyboard.press('Shift+Tab');

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await (await selectCell(0, 0, tableBottom)).click();
  await tablePage.keyboard.press('Shift+Tab');

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await (await selectCell(0, 0, tableBottom)).click();
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
