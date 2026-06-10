import { test, expect } from '@playwright/test';

/**
 * Regression test for the "Ask AI" docs assistant trigger.
 *
 * The widget mounts lazily on the first click of the header "Ask AI" button.
 * A mount/listener race previously dropped that first click, so the panel
 * never opened until a second click. The bootstrap now waits for the widget
 * to signal `docs-assistant:ready` before dispatching the first toggle, so a
 * single click must open the panel.
 *
 * See docs/src/scripts/docs-assistant-bootstrap.ts and
 * docs/src/components/DocsAssistant/DocsAssistantWidget.tsx.
 */

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
});

test('opens the docs assistant on the first "Ask AI" click', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/javascript-data-grid/`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await page.waitForLoadState('domcontentloaded');

  const panel = page.locator('.da-panel');
  const askAiBtn = page.locator('#header-assistant-btn');

  await expect(askAiBtn).toBeVisible();

  // A single click must open the panel (the regression: it took two clicks
  // because the first toggle raced the widget's listener registration).
  await askAiBtn.click();

  await expect(panel).toHaveAttribute('data-open', 'true');
  await expect(panel).toBeVisible();

  // Clicking again closes it, confirming the toggle wiring is intact.
  await askAiBtn.click();
  await expect(panel).toHaveAttribute('data-open', 'false');
});
