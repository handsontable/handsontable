import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

const urls = [
  '/cell-types-demo',
  '/arabic-rtl-demo',
  '/custom-style-demo',
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
    await tablePage.waitForTimeout(500);

    await tablePage.mouse.wheel(500, 1000);
    await tablePage.waitForTimeout(500);
    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
