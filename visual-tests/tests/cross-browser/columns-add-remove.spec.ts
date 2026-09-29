import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu
} from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

/**
 * Checks that inserting a column to the left and one to the right through the context menu renders both new
 * columns in the bottom table of the two-tables demo, and leaves the top table as it was. Owned by
 * DEV-2981.
 */
visualTest('Test columns add/remove', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop .ht-root-wrapper > .ht-grid > .ht-grid-content > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom .ht-root-wrapper > .ht-grid > .ht-grid-content > .handsontable');

  await tableTop.waitFor();
  await tableBottom.waitFor();

  await selectColumnHeaderByNameAndOpenMenu('Industry', tableBottom);
  await selectFromContextMenu('Insert column left');
  await selectColumnHeaderByNameAndOpenMenu('Industry', tableBottom);
  await selectFromContextMenu('Insert column right');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
