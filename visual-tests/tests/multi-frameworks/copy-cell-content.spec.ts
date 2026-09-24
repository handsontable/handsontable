import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

/**
 * Checks copying a cell and pasting it back over an edited value: the captures show the selected cell, the
 * edited value, and the original pasted back. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  let cell = await selectCell(2, 1);

  await cell.click();
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
  await tablePage.keyboard.press(`${helpers.modifier}+c`);
  await cell.press('Delete');

  cell = await selectCell(2, 1);
  await cell.dblclick();
  await table.type('-test');

  cell = await selectCell(3, 1);
  await cell.click();
  await tablePage.keyboard.press('Delete');

  cell = await selectCell(2, 1);
  await cell.click();

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
  await tablePage.keyboard.down(`${helpers.modifier}`);
  await tablePage.keyboard.press('v');
  await tablePage.keyboard.up(`${helpers.modifier}`);
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.up(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
