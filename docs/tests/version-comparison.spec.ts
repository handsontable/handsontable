import { test, expect } from '@playwright/test';

const PAGE_PATH = '/javascript-data-grid/changes-between-versions/';

test.describe('Version comparison page', () => {
  test('renders the React widget with default From and To selected', async ({ page }) => {
    await page.goto(PAGE_PATH);

    await expect(page.locator('#version-comparison-root')).toBeAttached();
    await expect(page.locator('.vc-selector-trigger').first()).toBeVisible();

    const count = page.locator('[data-testid="entry-count"]');
    await expect(count).toBeVisible();
    const initial = await count.textContent();
    expect(initial).toContain('changes');
  });

  test('changing the From version updates the entry count', async ({ page }) => {
    await page.goto(PAGE_PATH);
    const count = page.locator('[data-testid="entry-count"]');
    const before = await count.textContent();

    const fromWrapper = page.locator('.vc-selector', { hasText: 'From' });
    await fromWrapper.locator('.vc-selector-trigger').click();
    await fromWrapper.locator('.vc-selector-item', { hasText: /^14\.0/ }).click();

    await expect(count).not.toHaveText(before ?? '');
  });

  test('clicking a filter tab narrows the visible entries', async ({ page }) => {
    await page.goto(PAGE_PATH);

    await page.getByRole('tab', { name: 'Breaking' }).click();
    await expect(page.locator('.vc-pill-breaking').first()).toBeVisible();
  });

  test('deep link preselects From, To, and category', async ({ page }) => {
    await page.goto(`${PAGE_PATH}?from=14.0&to=17.0&category=breaking`);

    const toTrigger = page.locator('.vc-selector', { hasText: 'To' }).locator('.vc-selector-trigger');
    await expect(toTrigger).toContainText('17.0');

    const breakingTab = page.getByRole('tab', { name: 'Breaking' });
    await expect(breakingTab).toHaveAttribute('aria-selected', 'true');
  });

  test('renders inline markdown in entry titles and flattens links', async ({ page }) => {
    await page.goto(`${PAGE_PATH}?from=16.2&to=17.0&category=deprecated`);

    const list = page.locator('.vc-entry-list').first();
    await expect(list).toBeVisible();

    // Bold markdown becomes a <strong> element.
    await expect(list.locator('.vc-entry-title strong').first()).toBeVisible();

    // Inline code becomes a <code> element.
    await expect(list.locator('.vc-entry-title code').first()).toBeVisible();

    // No raw markdown syntax leaks through.
    const listText = (await list.textContent()) ?? '';
    expect(listText).not.toContain('**');
    expect(listText).not.toContain('[Migration guide]');

    // Inner markdown links are flattened: only the row-level anchor (one per entry) remains.
    const firstEntry = list.locator('.vc-entry').first();
    await expect(firstEntry.locator('a')).toHaveCount(1);
  });
});
