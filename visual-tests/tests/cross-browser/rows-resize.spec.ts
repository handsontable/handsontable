import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeRow } from '../../src/page-helpers';

visualTest('Test rows resizing', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await resizeRow(2, 200);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
