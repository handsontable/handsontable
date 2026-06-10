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

  test('TOC marker stays on a freshly-clicked short section', async ({ page }) => {
    await page.goto(`${PAGE_PATH}?from=14.0&to=17.0&category=all`);
    await expect(page.locator('.vc-toc a').first()).toBeVisible();

    // Click a patch release whose section is short enough that a mid-viewport
    // focus line falls past its bottom edge. 16.1.1 ("Security" only) is the
    // canonical case. A pure focus-line algorithm would pick the next-larger
    // section; the hashchange override holds the clicked section active until
    // the user scrolls away.
    await page.locator('.vc-toc a', { hasText: '16.1.1' }).click();

    await expect(page.locator('.vc-toc a.is-active')).toHaveText('16.1.1');
  });

  test('TOC marker tracks scroll across a section boundary in both directions', async ({ page }) => {
    await page.goto(`${PAGE_PATH}?from=14.0&to=17.0&category=all`);
    await expect(page.locator('.vc-toc a').first()).toBeVisible();

    // Center 16.1.0 vertically: the focus-line rule must pick it.
    await page.evaluate(() => {
      const el = document.getElementById('vc-v16.1.0');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      window.scrollBy(0, rect.top + rect.height / 2 - window.innerHeight / 2);
    });
    await expect(page.locator('.vc-toc a.is-active')).toHaveText('16.1.0');

    // Scroll back up so 16.1.1 (above) takes the focus line. The marker must
    // move symmetrically — not lag behind by one version.
    await page.evaluate(() => {
      const el = document.getElementById('vc-v16.1.1');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      window.scrollBy(0, rect.top + rect.height / 2 - window.innerHeight / 2);
    });
    await expect(page.locator('.vc-toc a.is-active')).toHaveText('16.1.1');
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
