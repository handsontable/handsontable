import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { clickRelativeToViewport } from '../../../../src/page-helpers';

/**
 * The look of the RTL context menu, in Arabic, with its Alignment submenu open from the top-left
 * corner, where there is no room on the inline end side and the submenu flips to the right. Where the
 * submenu opens is asserted from DOM rects in `tests/e2e/submenu-position.spec.ts`, in both grid
 * directions and both document directions; this capture is a check of how the mirrored menu looks.
 * `main` only: `Positioner` has no theme-specific branch, the e2e spec asserts its result on all
 * three themes, and `../menus-position.spec.ts` photographs an open submenu on every js variant. Owned
 * by DEV-3136.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/context-menu-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  // The menu names a submenu's container after the item's LABEL, with every character outside A-Z,
  // a-z, and 0-9 turned into an underscore, so the Arabic "Alignment" leaves only underscores and there
  // is no `htContextMenuSub_Alignment` here. Alignment is the only VISIBLE item with a submenu in the
  // demo's context menu: `customBorders` is off, and the export item, which has one, stays hidden
  // without `exportFile` settings. So the one submenu container, found by the class every submenu
  // carries, is Alignment's.
  const submenu = tablePage.locator('.htContextMenu[class*="htContextMenuSub_"]');
  const firstOption = submenu.locator(':scope > .ht_master .htCore tbody td').first();

  await clickRelativeToViewport(80, 80, 'right'); // top-left
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp');
  await tablePage.keyboard.press('ArrowUp'); // highlights "Alignment", counting from the end
  await tablePage.keyboard.press('ArrowLeft'); // opens it and highlights its first option
  await expect(submenu).toBeVisible();
  await expect(firstOption).toHaveClass(/\bcurrent\b/);

  // the mirrored menu with the submenu flipped to its right, first option highlighted
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
