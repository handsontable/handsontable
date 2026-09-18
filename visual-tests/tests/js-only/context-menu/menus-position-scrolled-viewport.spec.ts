import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  clickRelativeToViewport,
  selectFromContextMenu,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
  closeTheMenu,
} from '../../../src/page-helpers';

visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/context-menu-demo')
      .getFullUrl()
  );

  await scrollTableToTheInlineEnd();
  await scrollTableToTheBottom();

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
