import { test, expect } from '@playwright/test';

const PAGE_PATH = '/javascript-data-grid/version-comparison/';

test.describe('Version comparison page', () => {
  test('renders the React widget with default From and To selected', async ({ page }) => {
    await page.goto(PAGE_PATH);

    await expect(page.locator('#version-comparison-root')).toBeAttached();
    await expect(page.locator('.vc-controls select').first()).toBeVisible();

    const count = page.locator('[data-testid="entry-count"]');
    await expect(count).toBeVisible();
    const initial = await count.textContent();
    expect(initial).toContain('changes');
  });

  test('changing the From version updates the entry count', async ({ page }) => {
    await page.goto(PAGE_PATH);
    const count = page.locator('[data-testid="entry-count"]');
    const before = await count.textContent();

    const fromSelect = page.locator('label.vc-selector', { hasText: 'From' }).locator('select');
    await fromSelect.selectOption('14.0');

    await expect(count).not.toHaveText(before ?? '');
  });

  test('clicking a filter tab narrows the visible entries', async ({ page }) => {
    await page.goto(PAGE_PATH);

    await page.getByRole('tab', { name: 'Breaking' }).click();
    await expect(page.locator('.vc-pill-breaking').first()).toBeVisible();
  });

  test('deep link preselects From, To, and category', async ({ page }) => {
    await page.goto(`${PAGE_PATH}?from=14.0&to=17.0&category=breaking`);

    const toSelect = page.locator('label.vc-selector', { hasText: 'To' }).locator('select');
    await expect(toSelect).toHaveValue('17.0');

    const breakingTab = page.getByRole('tab', { name: 'Breaking' });
    await expect(breakingTab).toHaveAttribute('aria-selected', 'true');
  });
});
