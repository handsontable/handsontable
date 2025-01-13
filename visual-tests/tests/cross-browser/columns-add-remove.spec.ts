import { test } from '../../src/test-runner';
import { selectColumnHeaderByNameAndOpenMenu } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

test('Test columns add/remove', async({ goto, tablePage }) => {
  await goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom > .handsontable');

  tableTop.waitFor();
  tableBottom.waitFor();

  await selectColumnHeaderByNameAndOpenMenu('Industry', tableBottom);
  await tablePage.getByText('Insert column left').click();
  await selectColumnHeaderByNameAndOpenMenu('Industry', tableBottom);
  await tablePage.getByText('Insert column right').click();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
