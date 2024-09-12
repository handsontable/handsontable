import path from 'path';
import { helpers } from '../../src/helpers';
import { testCrossBrowser } from '../../src/test-runner';
import {
  selectCell,
  CellBorder,
  setCellBorders,
} from '../../src/page-helpers';

const urls = [
  '/',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
urls.forEach((url) => {
  testCrossBrowser(`Test border for URL: ${url}`, async({ tablePage }) => {
    await tablePage.goto(url);

    const cell = await selectCell(5, 1);

    await setCellBorders(cell, CellBorder.Bottom);

    await (await selectCell(0, 0)).click(); // to move focus and show cell borders

    const testFileName = path.basename(__filename, '.spec.ts');

    await tablePage.screenshot({
      path: helpers.screenshotMultiUrlPath(testFileName, url),
    });
  });
});
