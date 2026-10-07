import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu
} from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

/**
 * Checks that inserting a column to the left and one to the right through the context menu renders
 * both new columns in the bottom table of the two-tables demo, and leaves the top table as it was, in
 * Chromium, Firefox and WebKit: the demo's one render on Firefox and WebKit. One capture in each
 * browser, after asserting the two new headers sit on either side of "Industry". The insertion itself
 * is asserted by the Jasmine column-insertion suites. Owned by DEV-3257.
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

  // The inserted columns take the spreadsheet-letter labels of their positions.
  await expect(tableBottom.locator('.ht_clone_top thead tr:last-child th').nth(2)).toHaveText('B');
  await expect(tableBottom.locator('.ht_clone_top thead tr:last-child th').nth(3)).toHaveText('Industry');
  await expect(tableBottom.locator('.ht_clone_top thead tr:last-child th').nth(4)).toHaveText('D');
  // Each grid keeps its own context menu container, so "closed" is no visible one.
  await expect(tablePage.locator(`${helpers.selectors.contextMenu}:visible`)).toHaveCount(0);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
