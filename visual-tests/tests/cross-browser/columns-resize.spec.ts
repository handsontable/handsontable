import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeColumn } from '../../src/page-helpers';

test('Test column resizing', async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await resizeColumn('Cost', 200);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
