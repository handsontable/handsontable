import { visualTest, expect, waitForScrollbarClearanceToClose, CLASSIC } from '../../src/test-runner';
import {
  selectCell,
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu,
} from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

/**
 * Checks that a value copied from one table pastes into a writable cell of the other table and not into a
 * read-only one. It asserts the cell text and captures nothing: a functional check kept in this suite for
 * its three browsers. Owned by DEV-2981.
 */
visualTest('Copy between tables', {
  themes: [CLASSIC],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop .ht-root-wrapper > .ht-grid > .ht-grid-content > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom .ht-root-wrapper > .ht-grid > .ht-grid-content > .handsontable');

  await tableTop.waitFor();
  await tableBottom.waitFor();

  await selectColumnHeaderByNameAndOpenMenu('OS', tableTop);
  await selectFromContextMenu('Read only');
  await (await selectCell(2, 4, tableBottom)).click();
  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  const copiedText = await tablePage.evaluate(() => navigator.clipboard.readText());
  const tableTopCellNotReadOnly = (await selectCell(2, 4, tableTop));

  await tableTopCellNotReadOnly.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await tableTopCellNotReadOnly.innerText()).toBe(copiedText);

  const tableTopCellReadOnly = (await selectCell(2, 10, tableTop));

  await tableTopCellReadOnly.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await tableTopCellReadOnly.innerText()).not.toBe(copiedText);
});

/**
 * Checks that copy, paste, and cut move cell values inside one table. It asserts the cell text and captures
 * nothing: a functional check kept in this suite for its three browsers. Owned by DEV-2981.
 */
visualTest('Copy/Paste/Cut inside table', {
  themes: [CLASSIC],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop .ht-root-wrapper > .ht-grid > .ht-grid-content > .handsontable');

  await tableTop.waitFor();

  const sourceCell = await selectCell(2, 2, tableTop);

  await sourceCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  const copiedText = await tablePage.evaluate(() => navigator.clipboard.readText());
  const targetCell = await selectCell(3, 3, tableTop);

  await targetCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await targetCell.innerText()).toBe(copiedText);
  expect(copiedText).toBe('Subscription');

  const cutCell = await selectCell(4, 4, tableTop);

  await cutCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+x`);

  expect(await cutCell.innerText()).toBe('');
});

/**
 * Checks that a range selected across a scroll (Shift+click on the far bottom-right cell) is copied whole,
 * and pasted at the top-left of the grid. The capture shows the pasted block. Owned by DEV-2981.
 */
visualTest('Copy and paste data in a scrolled table', {
  themes: [CLASSIC],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/large-dataset-demo');

  const table = tablePage.locator('#root .ht-root-wrapper > .ht-grid > .ht-grid-content > .handsontable');
  const scrollableElement = table.locator('.ht_master .wtHolder');
  const sourceCell = await selectCell(1, 1, table);

  await tablePage.keyboard.down('Shift');
  await sourceCell.click();

  await scrollableElement.evaluate((element) => {
    element.scrollTo(10000, 10000); // Large values to ensure scrolling to the end
  });

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(20);

  // The scroll above puts a scrollbar track along both edges for about a second, and while it is there
  // the strip belongs to the scrollbar (#10370). The cell clicked next is the far bottom-right one, so
  // its centre sits inside both bands: without this wait the click is swallowed, the selection never
  // reaches the corner, and only one cell is copied. The assertions below still pass in that case -
  // they check the first pasted cell - so it shows up only as a changed screenshot.
  await waitForScrollbarClearanceToClose(tablePage);

  const endCell = table.locator('.ht_master table tr:last-of-type > td:last-of-type');

  await endCell.click();
  await tablePage.keyboard.up('Shift');

  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  await scrollableElement.evaluate((element) => {
    element.scrollTo(0, 0);
  });

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(20);

  const targetCell = await selectCell(0, 0, table);

  await targetCell.click();

  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  expect(await targetCell.innerText()).toBe('B2');
});

/**
 * Checks the same range cut and then pasted: the first capture shows the emptied source, the second the
 * pasted block. Owned by DEV-2981.
 */
visualTest('Cut and paste data in a scrolled table', {
  themes: [CLASSIC],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/large-dataset-demo');

  const table = tablePage.locator('#root .ht-root-wrapper > .ht-grid > .ht-grid-content > .handsontable');
  const scrollableElement = table.locator('.ht_master .wtHolder');
  let sourceCell = await selectCell(1, 1, table);

  await tablePage.keyboard.down('Shift');
  await sourceCell.click();

  await scrollableElement.evaluate((element) => {
    element.scrollTo(10000, 10000); // Large values to ensure scrolling to the end
  });

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(20);

  // The scroll above puts a scrollbar track along both edges for about a second, and while it is there
  // the strip belongs to the scrollbar (#10370). The cell clicked next is the far bottom-right one, so
  // its centre sits inside both bands: without this wait the click is swallowed, the selection never
  // reaches the corner, and only one cell is copied. The assertions below still pass in that case -
  // they check the first pasted cell - so it shows up only as a changed screenshot.
  await waitForScrollbarClearanceToClose(tablePage);

  const endCell = table.locator('.ht_master table tr:last-of-type > td:last-of-type');

  await endCell.click();
  await tablePage.keyboard.up('Shift');

  await tablePage.keyboard.press(`${helpers.modifier}+x`);

  await scrollableElement.evaluate((element) => {
    element.scrollTo(0, 0);
  });

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(20);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  sourceCell = await selectCell(1, 1, table);
  expect(await sourceCell.innerText()).toBe('');

  const targetCell = await selectCell(0, 0, table);

  await targetCell.click();

  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  expect(await targetCell.innerText()).toBe('B2');
});

/**
 * Checks that copy, paste, and cut work in a grid initialized as a web component (`<hot-table>`). It
 * asserts the cell text and captures nothing: a functional check kept in this suite for its three browsers.
 * Owned by DEV-2981.
 */
visualTest('Copy/Paste/Cut table initialized as web component', {
  themes: [CLASSIC],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/web-component-demo');

  const tableTop = tablePage.locator('#root > hot-table');

  await tableTop.waitFor();

  const sourceCell = await selectCell(1, 1);

  await sourceCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+c`);

  const copiedText = await tablePage.evaluate(() => navigator.clipboard.readText());
  const targetCell = await selectCell(3, 1);

  await targetCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+v`);

  expect(await targetCell.innerText()).toBe(copiedText);
  expect(copiedText).toBe('Cycling Cap');

  const cutCell = await selectCell(5, 1);

  await cutCell.click();
  await tablePage.keyboard.press(`${helpers.modifier}+x`);

  expect(await cutCell.innerText()).toBe('');
});
