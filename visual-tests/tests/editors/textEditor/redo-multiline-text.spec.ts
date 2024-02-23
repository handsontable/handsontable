import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { HotPage } from '../../../src/hotPage';

/**
 * Checks whether Control+Shift+Z redoes the last action for multiline text.
 */
test(__filename, async({ page }) => {
  const hot = new HotPage(page);

  await hot.loadTable();
  const cell = await hot.selectCell(1, 1);

  await hot.openEditor(cell);

  const cellEditor = await hot.selectEditor();

  await cellEditor.press('Control+Enter');
  await cellEditor.press('Control+Enter');
  await cellEditor.press('Control+Enter');

  await cell.press('Control+Z');
  await cell.press('Control+Z');
  await cell.press('Control+Shift+Z');

  await page.screenshot({ path: helpers.screenshotPath() });

  await cell.press('Control+Shift+Z');

  await page.screenshot({ path: helpers.screenshotPath() });
});
