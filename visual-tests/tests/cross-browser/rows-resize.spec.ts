import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeRow } from '../../src/page-helpers';

test('Test rows resizing', async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await resizeRow(2, 200);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
