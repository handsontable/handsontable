import { test } from '../../src/test-runner';
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
  test(`Test rows resizing for: ${url}`, async({ goto, tablePage }) => {
    await goto(url);

    const table = tablePage.locator(helpers.selectors.mainTable);

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await cell.click();
    await tablePage.screenshot({ path: helpers.screenshotPath() });

    await selectColumnHeaderByIndex(2);
    await selectColumnHeaderByIndex(5, ['Shift']);

    await tablePage.screenshot({ path: helpers.screenshotPath() });

    await selectRowHeaderByIndex(2);
    await selectRowHeaderByIndex(5, ['Shift']);

    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
