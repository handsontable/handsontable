import { visualTest, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  clickRelativeToViewport,
  scrollTableToTheInlineEnd,
  scrollTableToTheBottom,
  closeTheMenu,
} from '../../../../src/page-helpers';

/**
 * Checks that, in RTL, the context menu and its Alignment submenu open inside the viewport from each corner
 * of a grid scrolled to its bottom and inline end. One capture per corner. Owned by DEV-2981.
 */
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
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(-80, 80, 'right'); // top-right
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp'); // selects "Alignment" submenu option
  await tablePage.keyboard.press('ArrowLeft'); // selects "Left" submenu option
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(80, -80, 'right'); // bottom-left
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp'); // selects "Alignment" submenu option
  await tablePage.keyboard.press('ArrowLeft');
  await tablePage.keyboard.press('ArrowUp'); // selects "Left" submenu option
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await clickRelativeToViewport(-80, -80, 'right'); // bottom-right
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp'); // selects "Alignment" submenu option
  await tablePage.keyboard.press('ArrowLeft');
  await tablePage.keyboard.press('ArrowUp'); // selects "Left" submenu option
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
