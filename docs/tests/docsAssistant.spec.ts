import { test, expect, type Page } from '@playwright/test';

/**
 * Regression test for the docs assistant ("Ask AI") header button.
 *
 * The button is bound by initMobileNav() in Header.astro. A regression
 * (PR #12656) registered initMobileNav() only on the `astro:page-load` event,
 * which never fires on this site because it has no Astro ClientRouter. As a
 * result initMobileNav() never ran, the button was never wired, and clicking
 * "Ask AI" did nothing -- so a reader who had closed the panel could never
 * reopen it. The fix runs initMobileNav() on a readyState-based call instead.
 *
 * Without the fix these tests fail: the click produces no toggle and the panel
 * stays closed. They also guard against re-introducing the Preact hydration
 * crash (`NotFoundError: insertBefore`, Sentry HANDSONTABLE-DOCS-1BT) that the
 * deferred panel relocation was meant to avoid.
 */

const PAGE = '/javascript-data-grid/';
const HYDRATION_ERROR = /insertBefore|NotFoundError|reconcil/i;

// Mirror the cookie setup used by the other docs E2E tests: dismiss the cookie
// consent banner and (when running against the staging deploy) pass its gate.
test.beforeEach(async ({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || 'http://localhost');

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
});

/**
 * Collects genuine page errors, ignoring no-backend network noise. Fails the
 * test if the Preact hydration crash reappears.
 */
function trackHydrationErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('pageerror', (err) => {
    if (HYDRATION_ERROR.test(err.message)) {
      errors.push(err.message);
    }
  });

  return errors;
}

/** Seeds the persisted open/closed state before any page script runs. */
async function seedOpenState(page: Page, open: boolean): Promise<void> {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem('hot-docs-chat-open', value);
    } catch {
      // localStorage may be unavailable; the widget defaults to closed.
    }
  }, open ? 'true' : 'false');
}

/**
 * Waits until the header init script has run and bound the Ask AI button.
 * initMobileNav() relocates #mobile-nav-overlay to be a direct child of <body>
 * as part of the same init that binds the button, so its presence there is a
 * deterministic "button is now wired" signal. This avoids racing the binding,
 * which the fix schedules on window.load.
 */
async function waitForHeaderInit(page: Page): Promise<void> {
  await expect(page.locator('body > #mobile-nav-overlay')).toBeAttached();
}

test('opens the docs assistant on a single "Ask AI" click (from a closed panel)', async ({ page, baseURL }) => {
  const hydrationErrors = trackHydrationErrors(page);

  await seedOpenState(page, false);
  await page.goto(`${baseURL}${PAGE}`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  // initMobileNav binds on DOMContentLoaded; the panel relocation runs on load.
  await page.waitForLoadState('load');
  await waitForHeaderInit(page);

  const panel = page.locator('.da-panel');
  const askAiBtn = page.locator('#header-assistant-btn');

  await expect(askAiBtn).toBeVisible();
  await expect(panel).toHaveAttribute('data-open', 'false');

  // A single click must open the panel (the regression left it dead).
  await askAiBtn.click();
  await expect(panel).toHaveAttribute('data-open', 'true');
  await expect(panel).toBeInViewport();

  expect(hydrationErrors, hydrationErrors.join('\n')).toEqual([]);
});

test('reopens the panel after the user closes it with the X (the reported flow)', async ({ page, baseURL }) => {
  const hydrationErrors = trackHydrationErrors(page);

  // Returning reader: the panel was left open, so it auto-opens on load.
  await seedOpenState(page, true);
  await page.goto(`${baseURL}${PAGE}`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await page.waitForLoadState('load');
  await waitForHeaderInit(page);

  const panel = page.locator('.da-panel');
  const askAiBtn = page.locator('#header-assistant-btn');
  const closeBtn = page.locator('button[aria-label="Close assistant"]');

  await expect(panel).toHaveAttribute('data-open', 'true');

  // Close with the panel's X button (part of the React widget).
  await closeBtn.click();
  await expect(panel).toHaveAttribute('data-open', 'false');

  // The header "Ask AI" button must reopen it -- this is what broke.
  await askAiBtn.click();
  await expect(panel).toHaveAttribute('data-open', 'true');

  expect(hydrationErrors, hydrationErrors.join('\n')).toEqual([]);
});
