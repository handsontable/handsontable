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
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(20);
  await cellEditor.press('Control+Enter');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(20);
  await cellEditor.press('Control+Enter');

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(100);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await cell.press('Control+Z');

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(100);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await cell.press('Control+Z');

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(100);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
