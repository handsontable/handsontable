import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { selectCell, selectEditor, openEditor } from '../../../../src/page-helpers';

/**
 * Meant to check that the cell value can be edited by hand in the date editor. The editor is a native
 * `<input type="date">`, so the Backspace the spec presses acts on a date segment rather than on the last
 * character of the value; the capture shows the open editor after it. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {

  const cell = await selectCell(1, 2);

  await openEditor(cell);

  const cellEditor = await selectEditor();

  await cellEditor.press('Backspace'); // acts on the focused segment of the native date input

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
