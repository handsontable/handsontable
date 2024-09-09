import path from 'path';
import { testE2E } from '../../src/test-runner';
import { selectColumnHeaderByNameAndOpenMenu } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
testE2E(__filename, async({ tablePage }) => {
  await tablePage.goto('/scenario-grid');

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
    path: helpers.screenshotE2ePath(testFileName),
  });
});
