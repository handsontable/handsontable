import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import {
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu,
} from '../../src/page-helpers';

test('Test freezing', async({ goto, tablePage }) => {
  await goto('/cell-types-demo');
  await selectColumnHeaderByNameAndOpenMenu('Cost');
  await selectFromContextMenu('"Freeze column"');

  await tablePage.mouse.wheel(500, 0);
  await tablePage.waitForTimeout(500);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
