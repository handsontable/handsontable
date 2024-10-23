import path from 'path';
import { helpers } from '../../src/helpers';
import { testCrossBrowser } from '../../src/test-runner';
import {
  selectCell,
  createSelection,
} from '../../src/page-helpers';

const urls = [
  '/merged-cells-demo',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
urls.forEach((url) => {
  testCrossBrowser.skip(`Test merging for URL: ${url}`, async({ tablePage }) => {
    await tablePage.goto(url);

    const cellFrom = await selectCell(15, 1);
    const cellTo = await selectCell(20, 2);

    await createSelection(cellFrom, cellTo);

    await cellFrom.click({ button: 'right' });
    await tablePage.getByText('Merge cells').click();

    const testFileName = path.basename(__filename, '.spec.ts');

    await tablePage.screenshot({
      path: helpers.screenshotMultiUrlPath(testFileName, url),
    });
  });
});
