import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { selectCell, selectEditor, openEditor } from '../../../../src/page-helpers';

/**
 * Checks whether it's possible to manually edit the cell value.
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

  await cellEditor.press('Backspace'); // Should remove one character from the end of the value

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
