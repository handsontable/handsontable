import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

/**
 * The "Select all" and "Select none" links above the "filter by value" list are each one button.
 * Their wrapper used to carry `role="button"` too, so a screen reader met a button nested in a
 * button (axe `nested-interactive`). The role now sits on the focusable link only, and the wrapper
 * has none.
 */
test.describe('Filters — "Select all" and "Select none" roles', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: FiltersValueListPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();
    await grid.openMenu('Name');
  });

  test('each link is exposed as exactly one button with its visible text as the name', async() => {
    await expect(grid.menu.getByRole('button', { name: 'Select all', exact: true })).toHaveCount(1);
    await expect(grid.menu.getByRole('button', { name: 'Select none', exact: true })).toHaveCount(1);
    await expect(grid.selectAllLink).toHaveRole('button');
    await expect(grid.clearAllLink).toHaveRole('button');
    await expect(grid.menu.locator('.htUISelectAll')).not.toHaveAttribute('role');
    await expect(grid.menu.locator('.htUIClearAll')).not.toHaveAttribute('role');
  });

  test('the buttons stay keyboard operable', async({ page }) => {
    await grid.selectAllLink.focus();
    await page.keyboard.press('Tab');
    await expect(grid.clearAllLink).toBeFocused();

    await page.keyboard.press('Enter');
    await expect.poll(async() => (await grid.listedValues()).some(({ checked }) => checked)).toBe(false);

    await page.keyboard.press('Shift+Tab');
    await expect(grid.selectAllLink).toBeFocused();

    await page.keyboard.press('Enter');
    await expect.poll(async() => (await grid.listedValues()).every(({ checked }) => checked)).toBe(true);
  });
});
