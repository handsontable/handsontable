import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  clickRelativeToViewport,
  selectFromContextMenu,
  closeTheMenu,
} from '../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/context-menu-demo')
      .getFullUrl()
  );

  await clickRelativeToViewport(80, 80, 'right'); // top-left
  await selectFromContextMenu('Alignment');
  await tablePage.keyboard.press('ArrowDown'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(-80, 80, 'right'); // top-right
  await selectFromContextMenu('Alignment');
  await tablePage.keyboard.press('ArrowDown'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(80, -80, 'right'); // bottom-left
  await selectFromContextMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp'); // selects "Bottom" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(-80, -80, 'right'); // bottom-right
  await selectFromContextMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp'); // selects "Bottom" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
