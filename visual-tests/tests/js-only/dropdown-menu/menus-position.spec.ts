import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  openHeaderDropdownMenu,
  selectFromDropdownMenu,
  closeTheMenu,
} from '../../../src/page-helpers';

/**
 * The look of the column dropdown menu with its Alignment submenu open, opened from column A (the
 * submenu to the right) and from column L near the viewport's right edge (the submenu flipped to the
 * left). Where the submenu opens is asserted from DOM rects in `tests/e2e/submenu-position.spec.ts`,
 * on all six theme and bundle legs; these captures are a check of how it looks. `main` only:
 * `Positioner` has no theme-specific branch, and the e2e spec asserts its result on all three themes.
 * The dropdown menu itself is photographed on all five js variants by the `js-only/filters` specs,
 * with no submenu open, and `js-only/context-menu/menus-position` photographs an open submenu, whose
 * rules the two menus share, on every js variant. Owned by DEV-3136.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dropdown-menu-demo')
      .getFullUrl()
  );

  const submenu = tablePage.locator('.htDropdownMenuSub_Alignment');
  const highlighted = submenu.locator(':scope > .ht_master .htCore tbody td.current');

  await openHeaderDropdownMenu('A');
  await selectFromDropdownMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowDown'); // highlights "Left", the first option
  await expect(highlighted).toHaveText('Left');

  // the submenu to the right of the menu, with "Left" highlighted
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await closeTheMenu();

  await openHeaderDropdownMenu('L');
  await selectFromDropdownMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowDown'); // highlights "Left", the first option
  await expect(highlighted).toHaveText('Left');

  // the submenu flipped to the left of the menu, with "Left" highlighted
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
