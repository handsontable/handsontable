import path from 'path';
import { testCrossBrowser } from '../../src/test-runner';
import { selectColumnHeaderByNameAndOpenMenu } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
testCrossBrowser(__filename, async({ tablePage }) => {
  await tablePage.goto('/two-tables-demo');

  const tableTop = tablePage.locator('#tableTop > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom > .handsontable');

  tableTop.waitFor();
  tableBottom.waitFor();

  await selectColumnHeaderByNameAndOpenMenu('Industry', tableBottom);

  await tablePage.getByText('Insert column left').click();

  await selectColumnHeaderByNameAndOpenMenu('Industry', tableBottom);

  await tablePage.getByText('Insert column right').click();

  const testFileName = path.basename(__filename, '.spec.ts');

  await tablePage.screenshot({
    path: helpers.screenshotMultiUrlPath(testFileName),
  });
});
