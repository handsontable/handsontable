import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { openHeaderDropdownMenu } from '../../../../src/page-helpers';

/**
 * The look of the RTL column dropdown menu, in Arabic, with its Alignment submenu open from column A,
 * which in RTL sits at the inline start on the right. Where the submenu opens is asserted from DOM
 * rects in `tests/e2e/submenu-position.spec.ts`, in both grid directions and both document
 * directions; this capture is a check of how the mirrored dropdown menu looks. `main` only, for the
 * reason `../menus-position.spec.ts` gives. Owned by DEV-3136.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dropdown-menu-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  // The menu names a submenu's container after the item's LABEL, with every character outside A-Z,
  // a-z, and 0-9 turned into an underscore, so the Arabic "Alignment" leaves only underscores and there
  // is no `htDropdownMenuSub_Alignment` here. Alignment is the only item with a submenu in the dropdown
  // menu's default list, so the one submenu container, found by the class every submenu carries, is
  // Alignment's.
  const submenu = tablePage.locator('.htDropdownMenu[class*="htDropdownMenuSub_"]');
  const firstOption = submenu.locator(':scope > .ht_master .htCore tbody td').first();

  await openHeaderDropdownMenu('A');
  await tablePage.keyboard.press('ArrowUp'); // highlights "Alignment", the last item
  await tablePage.keyboard.press('ArrowLeft'); // opens it and highlights its first option
  await expect(submenu).toBeVisible();
  await expect(firstOption).toHaveClass(/\bcurrent\b/);

  // the mirrored dropdown menu with its submenu open, first option highlighted
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
