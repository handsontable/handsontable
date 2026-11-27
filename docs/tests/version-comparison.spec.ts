import { test, expect } from '@playwright/test';

const PAGE_PATH = '/docs/javascript-data-grid/changes-between-versions/';

test.beforeEach(async ({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || '');

  await page.context().addCookies([
    {
      name: 'CookieConsent',
      value: '-2',
      domain: url.hostname,
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
      value: process.env.PASS_COOKIE ?? '',
      domain: 'dev.handsontable.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Pre-navigate so the host's bot-verification challenge completes and sets its
  // first-party cookie before the test's own navigation runs.
  await page.goto(PAGE_PATH);
  await expect(page.getByText('We are verifying your connection')).toHaveCount(0, { timeout: 30000 });
});

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

    // Wait for the widget to render before snapshotting the baseline count.
    // Without this, before=0 on slow CI and the poll passes trivially when
    // entries appear, regardless of whether the selector interaction worked.
    await expect(page.locator('.vc-entry').first()).toBeVisible();

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

    // No raw markdown syntax leaks through — inline links are flattened to plain text.
    const listText = (await list.textContent()) ?? '';
    expect(listText).not.toContain('**');
    expect(listText).not.toContain('[Migration guide]');
  });

  test('links only the PR number to GitHub, not the whole entry', async ({ page }) => {
    await page.goto(`${PAGE_PATH}?from=16.0&to=19.0`);

    const entries = page.locator('.vc-entry');

    await expect(entries.first()).toBeVisible();

    // The row itself is not a link, so the text next to the number is not clickable.
    await expect(page.locator('a.vc-entry-compact')).toHaveCount(0);
    await expect(page.locator('a.vc-featured-card')).toHaveCount(0);

    // An entry with a PR number holds exactly one link, and it is the number.
    const linkedEntry = entries.filter({ has: page.locator('a.vc-entry-pr') }).first();

    await expect(linkedEntry.locator('a')).toHaveCount(1);

    const number = linkedEntry.locator('a.vc-entry-pr');
    const text = (await number.textContent()) ?? '';

    await expect(number).toHaveAttribute(
      'href',
      new RegExp(`^https://github\\.com/handsontable/handsontable/(pull|issues)/${text.replace('#', '')}$`)
    );
    await expect(number).toHaveAttribute('target', '_blank');
  });

  test('links only the PR number on a featured card', async ({ page }) => {
    await page.goto(`${PAGE_PATH}?from=16.0&to=19.0`);

    const cards = page.locator('.vc-featured-card');

    await expect(cards.first()).toBeVisible();

    // Each card is a plain container, and the only link in it is the PR number.
    const linkedCard = cards.filter({ has: page.locator('a.vc-featured-card-pr') }).first();

    await expect(linkedCard.locator('a')).toHaveCount(1);
    await expect(linkedCard.locator('a.vc-featured-card-pr')).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\/handsontable\/handsontable\/(pull|issues)\/\d+$/
    );
  });
});
