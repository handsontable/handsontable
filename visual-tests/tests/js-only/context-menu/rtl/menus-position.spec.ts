import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { clickRelativeToViewport } from '../../../../src/page-helpers';

/**
 * The look of the RTL context menu, in Arabic, with its Alignment submenu open from the top-left
 * corner, where there is no room on the inline end side and the submenu flips to the right. Where the
 * submenu opens is asserted from DOM rects in `tests/e2e/submenu-position.spec.ts`, for every corner
 * in both layout directions; this capture is a check of how the mirrored menu looks. Owned by
 * DEV-3136.
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

  // The labels are Arabic, so the submenu is identified by its container, which the menu names after
  // the item (`htContextMenuSub_Alignment`) whatever the language.
  const submenu = tablePage.locator('.htContextMenuSub_Alignment');
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
