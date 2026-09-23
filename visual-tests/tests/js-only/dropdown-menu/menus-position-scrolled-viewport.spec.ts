import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  openHeaderDropdownMenu,
  selectFromDropdownMenu,
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
      .setBaseUrl('/dropdown-menu-demo')
      .getFullUrl()
  );

  await scrollTableToTheInlineEnd();
  await scrollTableToTheBottom();

  await openHeaderDropdownMenu('AM');
  await selectFromDropdownMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowDown'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await openHeaderDropdownMenu('AX');
  await selectFromDropdownMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowDown'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
