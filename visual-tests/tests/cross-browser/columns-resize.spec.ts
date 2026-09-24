import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeColumn } from '../../src/page-helpers';

visualTest('Test column resizing', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await resizeColumn('Cost', 200);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
