import { helpers } from '../../src/helpers';
import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectCell,
  CellBorder,
  setCellBorders,
} from '../../src/page-helpers';

/**
 * Checks that a bottom border set through the context menu renders on the cell once the selection has
 * moved away from it, in Chromium, Firefox and WebKit: a 1px border whose position the engines round
 * differently. One capture in each browser, after asserting the selection moved to the first cell and
 * exactly one custom border segment is drawn. Custom borders on every theme are photographed by
 * `js-only/custom-borders` on Chromium, on the custom-borders demo's own ranges; a border set through
 * the menu is captured only here. Owned by DEV-3257.
 */
visualTest('Test borders', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  const cell = await selectCell(5, 1);

  await setCellBorders(cell, CellBorder.Bottom);

  const firstCell = await selectCell(0, 0);

  await firstCell.click(); // to move focus and show cell borders
  await expect(firstCell).toHaveClass(/(^|\s)current(\s|$)/);
  // A custom border is drawn as four segments, three of them hidden here; the selection's own
  // segments carry `current`, `area`, `fill` or `corner`.
  const customSegments = tablePage.locator(`${helpers.selectors.mainTable} .ht_master `
    + '.wtBorder:not(.current):not(.area):not(.fill):not(.corner):not(.hidden)');

  await expect(customSegments).toHaveCount(1);
  await expect(customSegments).toBeVisible();

  await tablePage.screenshot({
    path: helpers.screenshotPath(),
  });
});
