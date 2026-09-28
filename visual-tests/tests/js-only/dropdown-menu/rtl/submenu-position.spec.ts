import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { openHeaderDropdownMenu } from '../../../../src/page-helpers';

/**
 * The look of the RTL column dropdown menu, in Arabic, with its Alignment submenu open from column A,
 * which in RTL sits at the inline start on the right. Where the submenu opens is asserted from DOM
 * rects in `tests/e2e/submenu-position.spec.ts`, at both inline edges in both layout directions; this
 * capture is a check of how the mirrored dropdown menu looks. Owned by DEV-3136.
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

  // The labels are Arabic, so the submenu is identified by its container, which the menu names after
  // the item (`htDropdownMenuSub_Alignment`) whatever the language.
  const submenu = tablePage.locator('.htDropdownMenuSub_Alignment');
  const firstOption = submenu.locator(':scope > .ht_master .htCore tbody td').first();

  await openHeaderDropdownMenu('A');
  await tablePage.keyboard.press('ArrowUp'); // highlights "Alignment", the last item
  await tablePage.keyboard.press('ArrowLeft'); // opens it and highlights its first option
  await expect(submenu).toBeVisible();
  await expect(firstOption).toHaveClass(/\bcurrent\b/);

  // the mirrored dropdown menu with its submenu open, first option highlighted
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
