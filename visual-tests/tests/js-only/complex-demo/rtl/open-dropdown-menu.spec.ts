import { visualTest, test, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { openHeaderDropdownMenu } from '../../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks how the column dropdown menu looks on the complex demo in RTL, opened on Age with its filters
 * components: the suite's one RTL capture of the filters UI. That the menu opens at the header, laid
 * out right to left with its condition and value components, and that the context menu opens on a cell
 * in either direction, are asserted in `tests/e2e/complex-demo-states.spec.ts` on every theme and
 * bundle, so this is a look check on `main` only; the `js-only/filters` specs photograph the dropdown
 * menu's filters components on every js variant, and `js-only/context-menu/rtl/menus-position`
 * photographs the RTL context menu. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  const menu = tablePage.locator('.htDropdownMenu:not([class*="htDropdownMenuSub_"])');

  await openHeaderDropdownMenu('Age');
  await expect(menu).toBeVisible();
  await expect(menu.locator('.htFiltersMenuCondition')).toBeVisible();
  await expect(menu.locator('.htFiltersMenuValue')).toBeVisible();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
