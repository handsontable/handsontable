import path from 'path';
import { testE2E } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell, selectColumnHeaderByIndex, selectRowHeaderByIndex } from '../../src/page-helpers';

const urls = [
  '/cell-types-demo',
  // '/arabic-rtl-demo',
  // '/custom-style-demo',
  // '/merged-cells-demo',
  // '/nested-headers-demo',
  // '/nested-rows-demo',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
urls.forEach((url) => {
  testE2E(`Test alignment for URL: ${url}`, async({ tablePage }) => {
    const testFileName = path.basename(__filename, '.spec.ts');

    await tablePage.goto(url);

    const table = tablePage.locator(helpers.selectors.mainTable);

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await cell.click();
    await tablePage.screenshot({ path: helpers.screenshotE2ePath(testFileName, url, 'select-cell') });

    await selectColumnHeaderByIndex(2);
    await selectColumnHeaderByIndex(5, ['Shift']);

    await tablePage.screenshot({ path: helpers.screenshotE2ePath(testFileName, url, 'select-column') });

    await selectRowHeaderByIndex(2);
    await selectRowHeaderByIndex(5, ['Shift']);

    await tablePage.screenshot({ path: helpers.screenshotE2ePath(testFileName, url, 'select-row') });

  });
});
