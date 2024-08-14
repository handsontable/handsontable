import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { openHeaderDropdownMenu, selectFromDropdownMenu } from '../../src/page-helpers';

test(__filename, async({ tablePage }) => {
  await openHeaderDropdownMenu(2);

  // The dropdown menu should be open
  await tablePage.screenshot({ path: helpers.screenshotPath() });
  await selectFromDropdownMenu('"Clear column"');

  // column should be cleared
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
