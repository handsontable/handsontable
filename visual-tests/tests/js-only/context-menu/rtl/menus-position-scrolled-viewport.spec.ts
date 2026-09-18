import { visualTest, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
  closeTheMenu,
} from '../../../../src/page-helpers';

visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/context-menu-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  await scrollTableToTheInlineEnd();
  await scrollTableToTheBottom();

  await clickRelativeToViewport(80, 80, 'right'); // top-left
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp'); // selects "Alignment" submenu option
  await tablePage.keyboard.press('ArrowLeft'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(-80, 80, 'right'); // top-right
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp'); // selects "Alignment" submenu option
  await tablePage.keyboard.press('ArrowLeft'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(80, -80, 'right'); // bottom-left
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp'); // selects "Alignment" submenu option
  await tablePage.keyboard.press('ArrowLeft');
  await tablePage.keyboard.press('ArrowUp'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(-80, -80, 'right'); // bottom-right
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp'); // selects "Alignment" submenu option
  await tablePage.keyboard.press('ArrowLeft');
  await tablePage.keyboard.press('ArrowUp'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
