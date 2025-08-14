import { test } from '../../src/test-runner';
import {
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu
} from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

test('Test columns add/remove', async({ goto, tablePage }) => {
  await goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop .ht-root-wrapper .ht-grid > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom .ht-root-wrapper .ht-grid > .handsontable');

  await tableTop.waitFor();
  await tableBottom.waitFor();

  await selectColumnHeaderByNameAndOpenMenu('Industry', tableBottom);
  await selectFromContextMenu('Insert column left');
  await selectColumnHeaderByNameAndOpenMenu('Industry', tableBottom);
  await selectFromContextMenu('Insert column right');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
