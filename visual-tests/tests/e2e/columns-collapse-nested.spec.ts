import path from 'path';
import { testE2E } from '../../src/test-runner';
import { collapseNestedColumn } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
testE2E.skip('sdfsdf', async({ tablePage }) => {
  await tablePage.goto('/scenario-grid');

  const tableTop = tablePage.locator('#tableTop > .handsontable');

  tableTop.waitFor();

  collapseNestedColumn('Category', tableTop);

  collapseNestedColumn('System', tableTop);

  const testFileName = path.basename(__filename, '.spec.ts');

  await tablePage.screenshot({ path: helpers.screenshotE2ePath(testFileName) });

});
