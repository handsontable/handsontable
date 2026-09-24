import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { collapseNestedColumn, scrollTableToTheInlineEnd } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

visualTest('Test collapsing nested headers', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/nested-headers-demo');

  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  await scrollTableToTheInlineEnd();

  await collapseNestedColumn('Category');
  await collapseNestedColumn('System');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
