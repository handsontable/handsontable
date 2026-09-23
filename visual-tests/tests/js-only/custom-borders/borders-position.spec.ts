import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  selectCell,
  makeSelectionFromCell,
} from '../../../src/page-helpers';

/**
 * Checks that the custom borders of the custom-borders demo stay in place beside a selection dragged 200 px
 * from a bordered cell. Owned by DEV-2981.
 */
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
