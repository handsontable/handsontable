import path from 'path';
import { testCrossBrowser } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { resizeColumn } from '../../src/page-helpers';

const url = '/cell-types-demo';

testCrossBrowser(__filename, async({ tablePage }) => {
  await tablePage.goto(url);

  const testFileName = path.basename(__filename, '.spec.ts');

  await resizeColumn('Cost', 200);

  await tablePage.screenshot({
    path: helpers.screenshotMultiUrlPath(testFileName, url, '_after_resize'),
  });
});
