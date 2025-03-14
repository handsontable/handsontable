import { test } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  openHeaderDropdownMenu,
  scrollTableToTheInlineEnd,
  closeTheMenu,
} from '../../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dropdown-menu-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  await scrollTableToTheInlineEnd();

  await openHeaderDropdownMenu('AM');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowRight'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await openHeaderDropdownMenu('AX');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowRight'); // selects "Left" submenu option
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
