import { test } from '../../src/test-runner';
import { collapseNestedColumn } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

test('Test collapsing nested headers', async({ goto, tablePage }) => {
  await goto('/nested-headers-demo');

  const table = tablePage.locator(helpers.selectors.mainTable);

  table.waitFor();

  await collapseNestedColumn('Category');
  await collapseNestedColumn('System');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
