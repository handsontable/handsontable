import { visualTest, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  clickRelativeToViewport,
  selectFromContextMenu,
} from '../../../src/page-helpers';

/**
 * The look of the context menu with its Alignment submenu open, from the top-left corner: the submenu
 * to the right of the menu, opening down, the row it belongs to expanded, and an option highlighted.
 * It is the one capture of an open submenu on every js variant, so it guards the seam and border
 * between a menu and its submenu on each theme; the dropdown menu's submenus share those rules
 * (`_dropdown-menu.scss`). Where the submenu opens, for every corner and both of its flips, is
 * asserted from DOM rects in `tests/e2e/submenu-position.spec.ts` on all six theme and bundle legs,
 * so the flipped placements are not captured. Owned by DEV-3136.
 */
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

  const submenu = tablePage.locator('.htContextMenuSub_Alignment');
  const highlighted = submenu.locator(':scope > .ht_master .htCore tbody td.current');

  await clickRelativeToViewport(80, 80, 'right'); // top-left
  await selectFromContextMenu('Alignment');
  await tablePage.keyboard.press('ArrowDown'); // highlights "Left", the first option
  await expect(highlighted).toHaveText('Left');

  // the submenu to the right of the menu, opening down, with "Left" highlighted
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
