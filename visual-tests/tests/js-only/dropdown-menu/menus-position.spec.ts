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
 * at both inline edges, in both layout directions, and with the grid scrolled, on all six theme and
 * bundle legs; these captures are a check of how it looks. `main` only, for the same reason as the
 * context-menu captures. Owned by DEV-3136.
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
