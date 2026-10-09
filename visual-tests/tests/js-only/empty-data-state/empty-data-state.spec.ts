import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how the empty-data-state panel looks in a grid with no rows and the demo's 400 px height: first
 * with its "No data available" message, then in the no-results state a filter reaches through the
 * dropdown menu, with the "Reset filters" button and the filtered column's header tinted and focused.
 * Where the panel sits for a fixed height, `height: 'auto'`, no height, no columns and RTL, the keyboard
 * path to the no-results state, and the Reset filters button clearing it are asserted from DOM rects and
 * the Filters API in `tests/e2e/empty-data-state-layout.spec.ts` on every theme and bundle; the other
 * heights only move the panel's bottom edge, so these are the family's two captures. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/empty-data-state-demo')
      .getFullUrl()
  );

  const panel = tablePage.locator('.ht-empty-data-state');
  const title = panel.locator('.ht-empty-data-state__title');
  const menu = tablePage.locator('.htDropdownMenu:not([class*="htDropdownMenuSub_"])');
  const companyName = tablePage.locator('.ht_clone_top thead th').filter({ hasText: /^Company name$/ });

  await expect(title).toHaveText('No data available');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // Into the corner header, onto Company name, open its menu, then Clear the value list and press OK.
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(companyName).toHaveClass(/\bcurrent\b/);
  await tablePage.keyboard.press('Alt+Shift+ArrowDown');
  await expect(menu).toBeVisible();
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUIClearAll a')).toBeFocused();
  await tablePage.keyboard.press('Enter');
  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUIButtonOK input')).toBeFocused();
  await tablePage.keyboard.press('Enter');

  await expect(menu).toBeHidden();
  await expect(title).toHaveText('No results found');
  await expect(panel.getByRole('button', { name: 'Reset filters', exact: true })).toBeVisible();
  await expect(companyName).toHaveClass(/\bhtFiltersActive\b/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
