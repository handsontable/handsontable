import { helpers } from '../../src/helpers';
import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectCell,
  CellBorder,
  setCellBorders,
} from '../../src/page-helpers';

/**
 * Checks that a bottom border set through the context menu renders on the cell once the selection has moved
 * away from it. Owned by DEV-2981.
 */
visualTest('Test borders', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  const cell = await selectCell(5, 1);

  await setCellBorders(cell, CellBorder.Bottom);
  await (await selectCell(0, 0)).click(); // to move focus and show cell borders

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({
    path: helpers.screenshotPath(),
  });
});
