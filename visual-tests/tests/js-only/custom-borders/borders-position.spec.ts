import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  selectCell,
  makeSelectionFromCell,
} from '../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/custom-borders-demo')
      .getFullUrl()
  );

  const cell = await selectCell(10, 3);

  await makeSelectionFromCell(cell, 200);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

});
