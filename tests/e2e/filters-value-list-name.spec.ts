import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

const HEADING = 'Filter by value:';

/**
 * The "Filter by value" section of the column menu names its search box with its visible heading.
 *
 * The search box had only a "Search" placeholder, which screen readers do not announce reliably and
 * which disappears once the user types. Its menu row was a `menuitem` whose content also holds the
 * search box, the two links and the value list, so its name did not contain its visible text (axe
 * `label-content-name-mismatch`, WCAG 2.5.3). The row stays a `menuitem`, the role a `menu` may own,
 * with no name of its own; a group inside it is named by the heading, and the search box is named by
 * the same heading.
 */
test.describe('Filters — "Filter by value" accessible names', () => {
  let grid: FiltersValueListPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersValueListPage(page, theme, bundle);
  });

  test('names the section and its search box with the visible heading', async({ page }) => {
    await grid.goto();
    await grid.openMenuWithKeyboard(0, 0);

    const section = grid.menu.getByRole('group', { name: HEADING, exact: true });

    await expect(section).toBeVisible();
    await expect(section.getByText(HEADING, { exact: true })).toBeVisible();

    const row = grid.menu.locator('td.htFiltersMenuValue');

    await expect(row).toHaveAttribute('role', 'menuitem');
    await expect(row).not.toHaveAttribute('aria-label');
    await expect(row).not.toHaveAttribute('aria-labelledby');
    await expect(row.getByRole('group', { name: HEADING, exact: true })).toHaveCount(1);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(grid.searchInput).toBeFocused();
    await expect(grid.searchInput).toHaveAccessibleName(HEADING);
    await expect(section.getByRole('textbox', { name: HEADING, exact: true })).toBeFocused();
  });

  test('keeps the search box name after the placeholder is gone', async({ page }) => {
    await grid.goto();
    await grid.openMenuWithKeyboard(0, 0);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(grid.searchInput).toBeFocused();

    await page.keyboard.type('a');

    await expect(grid.searchInput).toHaveValue('a');
    await expect(grid.searchInput).toHaveAccessibleName(HEADING);
  });

  test('writes no ARIA on the section when ariaTags is off', async() => {
    await grid.goto('aria=off');
    await grid.openMenuWithKeyboard(0, 0);

    const row = grid.menu.locator('td.htFiltersMenuValue');

    await expect(row).toBeVisible();
    await expect(row).not.toHaveAttribute('role');
    await expect(row.locator('[role="group"]')).toHaveCount(0);
    await expect(row.locator('[aria-labelledby]')).toHaveCount(0);
    await expect(row.locator('.htFiltersMenuLabel')).not.toHaveAttribute('id');
  });
});
