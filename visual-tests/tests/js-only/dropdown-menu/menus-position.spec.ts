import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  openHeaderDropdownMenu,
  selectFromDropdownMenu,
  closeTheMenu,
} from '../../../src/page-helpers';

/**
 * Checks that the column dropdown menu and its Alignment submenu open inside the viewport for a column at
 * the inline start and one further along. Owned by DEV-2981.
 */
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

  await openHeaderDropdownMenu('A');
  await selectFromDropdownMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowDown'); // selects "Left" submenu option
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await openHeaderDropdownMenu('L');
  await selectFromDropdownMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowDown'); // selects "Left" submenu option
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
