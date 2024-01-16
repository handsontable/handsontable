import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks whether it's possible to manually edit the cell value.
 */
test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);

  const cell = tbody.locator(helpers.findCell({ row: 1, column: 2, cellType: 'td' }));

  await cell.click();
  await cell.press('Enter');

  const cellEditor = table.locator(helpers.findCellEditor());

  await cellEditor.waitFor();
  await cellEditor.press('Backspace'); // Should remove one character from the end of the value

  await page.screenshot({ path: helpers.screenshotPath() });
});
