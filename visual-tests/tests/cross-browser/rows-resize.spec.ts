import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeRow } from '../../src/page-helpers';

/**
 * Checks that dragging the bottom edge of the third row's header (row index 2) about 200 px down makes that
 * row about 200 px taller, and renders the new height. Owned by DEV-2981.
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
