import path from 'path';
import { testCrossBrowser } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

import {
  openEditor,
  selectCell,
  selectEditor,
  undo,
  redo,
} from '../../src/page-helpers';

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
  testCrossBrowser(`Test undo/redo for URL: ${url}`, async({ tablePage }) => {
    await tablePage.goto(url);
    await tablePage.waitForLoadState('load');

    const table = tablePage.locator('#root > .handsontable');

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await openEditor(cell);

    const cellEditor = await selectEditor();

    await cellEditor.fill('test');
    await cellEditor.press('Enter');

    const testFileName = path.basename(__filename, '.spec.ts');

    await tablePage.screenshot({
      path: helpers.screenshotMultiUrlPath(testFileName, url, '-typeText'),
    });

    await undo();
    await tablePage.screenshot({
      path: helpers.screenshotMultiUrlPath(testFileName, url, '-undo'),
    });

    await redo();
    await tablePage.screenshot({
      path: helpers.screenshotMultiUrlPath(testFileName, url, '-redo'),
    });
  });
});
