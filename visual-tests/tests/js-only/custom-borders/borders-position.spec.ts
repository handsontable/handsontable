import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  selectCell,
  makeSelectionFromCell,
} from '../../../src/page-helpers';

visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/custom-borders-demo')
      .getFullUrl()
  );

  const cell = await selectCell(10, 3);

  await makeSelectionFromCell(cell, 200);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

});
