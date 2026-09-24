import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * Checks that a row selected by its header moves when the header is dragged up: the first capture shows the
 * selection, the second the new row order. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const cloneInlineStartTable = table.locator(helpers.selectors.cloneInlineStartTable);
  const cell = cloneInlineStartTable.locator(helpers.findCell({ row: 3, column: 0, cellType: 'th' }));

  // without coordinates, `click()` works in the middle of the element,
  // so in this case, it would deselect the checkbox
  // to avoid it, let's define coordinates inside of the cell, but outside of the checkbox
  await cell.click({ position: { x: 1, y: 1 } });
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  const cellCoordinates = await cell.boundingBox();

  await tablePage.mouse.move(cellCoordinates!.x + 1, cellCoordinates!.y + 1);
  await tablePage.mouse.down();
  await tablePage.mouse.move(cellCoordinates!.x + 1, cellCoordinates!.y - 50);
  await tablePage.mouse.up();
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted mouse.up(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
