import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  clickRelativeToViewport,
  selectFromContextMenu,
  closeTheMenu,
} from '../../../src/page-helpers';

/**
 * The look of the context menu with its Alignment submenu open, in the two placements that differ
 * most: from the top-left corner (submenu to the right, opening down) and from the bottom-right
 * corner (submenu flipped to the left, opening up). Where the submenu opens is asserted from DOM
 * rects in `tests/e2e/submenu-position.spec.ts`, on all six theme and bundle legs; these captures
 * are a check of how it looks. `main` only: `Positioner` has no theme-specific branch, and the e2e
 * spec asserts its result on all three themes. The context menu itself is photographed on all five
 * js variants by `js-only/complex-demo/open-dropdown-and-context-menu` and its RTL twin, but with
 * no submenu open, so an open submenu, the expanded row it belongs to, and a hovered menu row are
 * photographed on `main` only. Owned by DEV-3136.
 */
visualTest(__filename, {
  themes: ['main'],
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

  await closeTheMenu();

  await clickRelativeToViewport(-80, -80, 'right'); // bottom-right
  await selectFromContextMenu('Alignment');
  await tablePage.keyboard.press('ArrowUp'); // highlights "Bottom", the last option
  await expect(highlighted).toHaveText('Bottom');

  // the submenu flipped to the left of the menu, opening up, with "Bottom" highlighted
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
