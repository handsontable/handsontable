import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

test(__filename, async({ tablePage }) => {
  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  let cell = await selectCell(2, 1);

  await cell.click();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
  await tablePage.keyboard.press(`${helpers.modifier}+c`);
  await cell.press('Delete');

  cell = await selectCell(2, 1);
  await cell.dblclick();
  await table.type('-test');

  cell = await selectCell(3, 1);
  await cell.click();
  await tablePage.keyboard.press('Delete');

  cell = await selectCell(2, 1);
  await cell.click();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
  await tablePage.keyboard.down(`${helpers.modifier}`);
  await tablePage.keyboard.press('v');
  await tablePage.keyboard.up(`${helpers.modifier}`);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
