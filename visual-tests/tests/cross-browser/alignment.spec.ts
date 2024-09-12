import path from 'path';
import { testCrossBrowser } from '../../src/test-runner';
import { setCellAlignment, selectCell } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

const urls = [
  '/custom-style-demo',
  '/merged-cells-demo',
  '/nested-headers-demo',
  '/nested-rows-demo',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
urls.forEach((url) => {
  testCrossBrowser(`Test alignment for URL: ${url}`, async({ tablePage }) => {
    await tablePage.goto(url);
    await tablePage.waitForLoadState('load');

    const table = tablePage.locator(helpers.selectors.mainTable);

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await setCellAlignment('Right', cell);

    const testFileName = path.basename(__filename, '.spec.ts');

    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, url) });
  });
});
