import path from 'path';
import { testCrossBrowser } from '../../src/test-runner';
import { collapseNestedColumn } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
testCrossBrowser('Colapse nested headers', async({ tablePage }) => {
  await tablePage.goto('/nested-headers-demo');

  const table = tablePage.locator(helpers.selectors.mainTable);

  table.waitFor();

  await collapseNestedColumn('Category');

  await collapseNestedColumn('System');

  const testFileName = path.basename(__filename, '.spec.ts');

  await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName) });

});
