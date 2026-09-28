import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell, selectColumnHeaderByIndex, selectRowHeaderByIndex } from '../../src/page-helpers';

const urls = [
  '/cell-types-demo',
  '/arabic-rtl-demo',
  '/merged-cells-demo',
  '/nested-headers-demo',
  '/nested-rows-demo',
];

urls.forEach((url) => {
  /**
   * Checks that a cell selection, a column-range selection, and a row-range selection (a header click, then
   * a Shift+click) render their highlights on this demo route. Three captures per route in `urls`, in each
   * browser: the cell, the column range, and the row range. Owned by DEV-2981.
   */
  visualTest(`Test selection for: ${url}`, {
    themes: [CLASSIC],
    browsers: CROSS_BROWSERS,
    wrappers: [],
  }, async({ goto, tablePage }) => {
    await goto(url);

    const table = tablePage.locator(helpers.selectors.mainTable);

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await cell.click();
    // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted click(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
    await tablePage.screenshot({ path: helpers.screenshotPath() });

    await selectColumnHeaderByIndex(2);
    await selectColumnHeaderByIndex(5, ['Shift']);

    await tablePage.screenshot({ path: helpers.screenshotPath() });

    await selectRowHeaderByIndex(2);
    await selectRowHeaderByIndex(5, ['Shift']);

    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
