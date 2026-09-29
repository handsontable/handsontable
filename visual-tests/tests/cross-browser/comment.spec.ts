import { helpers } from '../../src/helpers';
import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectCell,
  selectFromContextMenu,
} from '../../src/page-helpers';

/**
 * Checks that adding a comment through the context menu renders the comment editor, with the typed text,
 * next to the cell. Owned by DEV-2981.
 */
visualTest('Test comments', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  (await selectCell(1, 1)).click({ button: 'right' });
  await selectFromContextMenu('Add comment');
  await tablePage.locator('.htComments').getByRole('textbox').fill('This is a comment');

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted fill(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
