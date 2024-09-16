import { test } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { selectCell, selectEditor, openEditor } from '../../../../src/page-helpers';

/**
 * Checks whether Control+Z undoes the last action for multiline text.
 */
test(__filename, async({ tablePage }) => {

  const cell = await selectCell(1, 1);

  await openEditor(cell);

  const cellEditor = await selectEditor();

  await cellEditor.press('Control+Enter');
  await cellEditor.press('Control+Enter');
  await cellEditor.press('Control+Enter');

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await cell.press('Control+Z');

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await cell.press('Control+Z');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
