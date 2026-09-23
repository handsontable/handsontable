import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeColumn } from '../../src/page-helpers';

/**
 * Checks that resizing the "Cost" column to 200 px renders the new width. Owned by DEV-2981.
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
