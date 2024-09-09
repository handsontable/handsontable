import path from 'path';
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
urls.forEach((url) => {
  test(`Test alignment for URL: ${url}`, async({ tablePage }) => {
    const testFileName = path.basename(__filename, '.spec.ts');

    await tablePage.goto(url);

    const table = tablePage.locator(helpers.selectors.mainTable);

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await cell.click();
    await tablePage.mouse.wheel(500, 1000);
    await tablePage.waitForTimeout(500);
    await tablePage.screenshot({ path: helpers.screenshotE2ePath(testFileName, url) });
  });
});
