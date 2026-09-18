import { helpers } from '../../src/helpers';
import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectCell,
  selectFromContextMenu,
} from '../../src/page-helpers';

visualTest('Test comments', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  (await selectCell(1, 1)).click({ button: 'right' });
  await selectFromContextMenu('Add comment');
  await tablePage.locator('.htComments').getByRole('textbox').fill('This is a comment');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
