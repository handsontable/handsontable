import path from 'path';
import { helpers } from '../../src/helpers';
import { testCrossBrowser } from '../../src/test-runner';

import { selectCell } from '../../src/page-helpers';

testCrossBrowser(__filename, async({ tablePage }) => {
  const url = '/';

  await tablePage.goto(url);

  (await selectCell(1, 1)).click({ button: 'right' });
  await tablePage.getByText('Add comment').click();
  await tablePage.getByRole('textbox').fill('This is a comment');
  const testFileName = path.basename(__filename, '.spec.ts');

  await tablePage.screenshot({
    path: helpers.screenshotMultiUrlPath(testFileName, url, '_after_resize'),
  });
});
