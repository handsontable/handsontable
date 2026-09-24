import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeColumn } from '../../src/page-helpers';

/**
 * Checks that dragging the "Cost" column's resize handle about 200 px to the right widens the column by
 * that much (from 150 px), and renders the new width. Owned by DEV-2981.
 */
visualTest('Test column resizing', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await resizeColumn('Cost', 200);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
