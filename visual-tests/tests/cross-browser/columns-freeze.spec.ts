import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import {
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu,
  waitForWheelScrollToSettle,
} from '../../src/page-helpers';

/**
 * Checks that a column frozen through the context menu stays pinned while the grid scrolls horizontally
 * with the mouse wheel, in Chromium, Firefox and WebKit, which each derive their own offset from the
 * same wheel delta. One capture in each browser, after asserting the frozen column's header is drawn
 * by the corner overlay and the grid scrolled. That the menu entry freezes the column is
 * asserted by the Jasmine column-freeze suite. Owned by DEV-3257.
 */
visualTest('Test freezing', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await selectColumnHeaderByNameAndOpenMenu('Cost');
  await selectFromContextMenu('Freeze column');

  const table = tablePage.locator(helpers.selectors.mainTable);

  await expect(table.locator('.ht_clone_top_inline_start_corner thead tr:last-child th').last()).toHaveText('Cost');

  await tablePage.mouse.wheel(500, 0);
  await waitForWheelScrollToSettle('scrollLeft', table);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
