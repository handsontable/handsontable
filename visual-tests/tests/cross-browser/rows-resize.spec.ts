import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeRow } from '../../src/page-helpers';

/**
 * Checks that resizing row 2 to 200 px renders the new height. Owned by DEV-2981.
 */
visualTest('Test rows resizing', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await resizeRow(2, 200);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
