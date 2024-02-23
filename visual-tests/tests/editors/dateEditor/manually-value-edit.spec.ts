import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { HotPage } from '../../../src/hotPage';

/**
 * Checks whether it's possible to manually edit the cell value.
 */
test(__filename, async({ page }) => {
  const hot = new HotPage(page);

  await hot.loadTable();

  const cell = await hot.selectCell(1, 2);

  await hot.openEditor(cell);

  const cellEditor = await hot.selectEditor();

  await cellEditor.press('Backspace'); // Should remove one character from the end of the value

  await page.screenshot({ path: helpers.screenshotPath() });
});
