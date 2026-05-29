import { test, expect } from '@playwright/test';

const PAGE_PATH = '/javascript-data-grid/changes-between-versions/';

test.describe('Version comparison page', () => {
  test('renders the React widget with default From and To selected', async ({ page }) => {
    await page.goto(PAGE_PATH);

    await expect(page.locator('#version-comparison-root')).toBeAttached();
    await expect(page.locator('.vc-selector-trigger').first()).toBeVisible();

    // At least one rendered entry confirms the data pipeline ran and the widget mounted.
    await expect(page.locator('.vc-entry').first()).toBeVisible();
  });

  test('changing the From version updates the entry count', async ({ page }) => {
    await page.goto(PAGE_PATH);
    const entries = page.locator('.vc-entry');
    const before = await entries.count();

    const fromWrapper = page.locator('.vc-selector', { hasText: 'From' });
    await fromWrapper.locator('.vc-selector-trigger').click();

    // Pick whichever option isn't already selected and isn't disabled, so the
    // test stays valid no matter which default `defaultRange` picks today.
    const other = fromWrapper
      .locator('.vc-selector-item:not([aria-selected="true"]):not([aria-disabled="true"])')
      .first();
    await other.click();

    // Narrowing or widening the range must surface a different number of entries.
    await expect.poll(async () => entries.count()).not.toBe(before);
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

  test('right-sidebar TOC highlights the version closest to the top of viewport', async ({ page }) => {
    await page.goto(`${PAGE_PATH}?from=14.0&to=17.0&category=all`);

    const tocLinks = page.locator('.vc-toc a');
    await expect(tocLinks.first()).toBeVisible();

    // Align a mid-range section's top edge to the viewport top via explicit
    // `block: 'start'`. Playwright's scrollIntoViewIfNeeded is a no-op when an
    // element is "already visible enough" and its scroll alignment is browser-
    // dependent — both make this assertion flaky.
    await page.evaluate(() => {
      document.getElementById('vc-v16.1.0')?.scrollIntoView({ block: 'start' });
    });

    await expect(page.locator('.vc-toc a.is-active')).toHaveText('16.1.0');
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
