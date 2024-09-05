import path from 'path';
import { test } from '../../src/test-runner';
import { openEditor, selectCell, selectEditor } from '../../src/page-helpers';

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
    await tablePage.goto(url);
    await tablePage.waitForLoadState('load');

    const table = tablePage.locator('#root > .handsontable');

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await openEditor(cell);

    const cellEditor = await selectEditor();

    await cellEditor.fill('test');

    // Generate a safe file name from the URL
    const safeUrl = url.replace(/[^\w]/g, '_');
    // Get the current test file name
    const testFileName = path.basename(__filename, '.ts');
    // Combine the test file name and the safe URL to create the screenshot path
    const screenshotPath = path.join(__dirname, 'screenshots', `${testFileName}_${safeUrl}.png`);

    await tablePage.screenshot({ path: screenshotPath });
  });
});
