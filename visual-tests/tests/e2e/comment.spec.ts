import { helpers } from '../../src/helpers';
import { test } from '../../src/test-runner';

import {
  selectCell,
} from '../../src/page-helpers';

test(__filename, async({ tablePage }) => {
  (await selectCell(1, 1)).click({ button: 'right' });
  await tablePage.getByText('Add comment').click();
  await tablePage.getByRole('textbox').fill('This is a comment');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
