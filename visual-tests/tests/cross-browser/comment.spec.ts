import { helpers } from '../../src/helpers';
import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectCell,
  selectFromContextMenu,
} from '../../src/page-helpers';

/**
 * Checks that adding a comment through the context menu renders the comment editor next to the cell,
 * with the typed text, in Chromium, Firefox and WebKit: the editor is a native textarea whose resize
 * grip, border and font each engine draws its own way. One capture in each browser, after asserting the
 * textarea holds the text and has the focus. Where the editor is placed is asserted by the Jasmine
 * comments suite. Owned by DEV-3257.
 */
visualTest('Test comments', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  await (await selectCell(1, 1)).click({ button: 'right' });
  await selectFromContextMenu('Add comment');

  const textarea = tablePage.locator('.htComments').getByRole('textbox');

  await textarea.fill('This is a comment');
  await expect(textarea).toHaveValue('This is a comment');
  await expect(textarea).toBeFocused();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
