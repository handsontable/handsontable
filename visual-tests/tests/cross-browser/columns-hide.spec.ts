import { helpers } from '../../src/helpers';
import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  columnsCount,
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu,
} from '../../src/page-helpers';

/**
 * Checks that hiding two columns through the context menu renders the hidden-column indicators on the
 * neighboring headers in Chromium, Firefox and WebKit. One capture in each
 * browser, after asserting the column count and that the menu closed. Hiding both columns and showing
 * them again from a header range (this spec's retired second capture) is asserted on all six theme and
 * bundle legs by `tests/e2e/hidden-columns-context-menu.spec.ts`. Owned by DEV-3257.
 */
visualTest('Test column hiding', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  expect(await columnsCount()).toBe(9);

  await selectColumnHeaderByNameAndOpenMenu('Name');
  await selectFromContextMenu('Hide column');

  expect(await columnsCount()).toBe(8);

  await selectColumnHeaderByNameAndOpenMenu('In stock');
  await selectFromContextMenu('Hide column');

  expect(await columnsCount()).toBe(7);
  await expect(tablePage.locator(helpers.selectors.contextMenu)).toBeHidden();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
