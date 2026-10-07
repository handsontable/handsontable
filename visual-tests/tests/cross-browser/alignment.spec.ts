import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { setCellAlignment, selectCell } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

/**
 * Checks that a cell aligned to the right through the context menu's Alignment submenu renders its
 * text flush right in Chromium, Firefox and WebKit, on the merged-cells demo, whose rows take their
 * heights from a `rowHeights` function. One capture in each browser, after asserting the cell carries
 * `htRight` and the menu closed. The alignment classes on cell meta and in the DOM are asserted by the
 * Jasmine alignment suite; the three other routes this spec photographed until DEV-3257 drew the same
 * CSS and are photographed by the scroll and selection specs. Owned by DEV-3257.
 */
visualTest('Test alignment for: /merged-cells-demo', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/merged-cells-demo');

  const cell = await selectCell(2, 2);

  await setCellAlignment('Right', cell);
  await expect(cell).toHaveClass(/(^|\s)htRight(\s|$)/);
  await expect(tablePage.locator(helpers.selectors.contextMenu)).toBeHidden();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
