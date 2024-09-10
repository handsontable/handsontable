import path from 'path';
import { testE2E } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectColumnHeaderByNameAndOpenMenu } from '../../src/page-helpers';

const url = '/cell-types-demo';

testE2E(__filename, async({ tablePage }) => {
  await tablePage.goto(url);

  const testFileName = path.basename(__filename, '.spec.ts');

  await selectColumnHeaderByNameAndOpenMenu('Cost');
  await tablePage.getByText('Freeze column').click();

  await tablePage.mouse.wheel(500, 0);
  await tablePage.waitForTimeout(500);

  await tablePage.screenshot({
    path: helpers.screenshotE2ePath(testFileName, url, '_freeze_and_scroll'),
  });
});
