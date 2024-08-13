import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { openEditor } from '../../../src/page-helpers';

/**
 * Checks whether it's possible to edit a cell value.
 */
test(__filename, async({ tablePage }) => {
  await tablePage.goto('/editors-grid');

  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor({ timeout: 2000 });

  const tableBody = table.locator(helpers.selectors.mainTableBody);
  const cell = tableBody.locator(helpers.findCell({ row: 2, column: 2, cellType: 'td' }));

  await openEditor(cell);
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  const cellEditor = table.locator('select.htSelectEditor');

  await cellEditor.waitFor();
  await cellEditor.press('ArrowDown');
  await cellEditor.press('Enter');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
