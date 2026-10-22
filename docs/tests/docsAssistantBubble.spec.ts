import { test, expect, type Page } from '@playwright/test';

/**
 * Docs assistant proactive bubble (SU-598, stage I).
 *
 * The bubble appears when a reader reaches the bottom of a long page and stays
 * idle for 3 seconds. It can show again on later page loads, never opens the
 * chat on its own, and never comes back once the reader closes it.
 */

const LONG_PAGE = '/javascript-data-grid/performance/';
const IDLE_MS = 3000;

// Mirror the cookie setup used by the other docs E2E tests.
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
 * Opens the long page with the chat closed and waits until the widget is mounted.
 */
async function openLongPage(page: Page, baseURL: string | undefined): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hot-docs-chat-open', 'false');
    } catch {
      // localStorage may be unavailable; the widget defaults to closed.
    }
  });
  await page.goto(`${baseURL}${LONG_PAGE}`);
  await page.waitForLoadState('load');
  await page.evaluate(() => window.docsAssistantEnsureMounted?.());
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');

  // Guard the premise: the page must be long enough for the trigger to apply.
  const isLong = await page.evaluate(
    () => document.documentElement.scrollHeight >= window.innerHeight * 2
  );

  expect(isLong, `${LONG_PAGE} must be at least two viewports tall`).toBe(true);
}

async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
}

test('shows a bubble after 3 seconds idle at the bottom, without opening the chat', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);

  const bubble = page.locator('.da-proactive');

  // Not at the bottom yet: nothing appears, however long the reader waits.
  await page.waitForTimeout(IDLE_MS + 500);
  await expect(bubble).toHaveCount(0);

  await scrollToBottom(page);
  await page.waitForTimeout(IDLE_MS - 2000);
  await expect(bubble).toHaveCount(0);
  await expect(bubble).toBeVisible({ timeout: 4000 });
  await expect(bubble).toContainText('Ask AI');

  // The bubble is a suggestion only: the chat stays closed.
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
});

test('does not come back after the reader dismisses it', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await scrollToBottom(page);

  const bubble = page.locator('.da-proactive');

  await expect(bubble).toBeVisible({ timeout: IDLE_MS + 3000 });
  await page.getByRole('button', { name: 'Dismiss suggestion' }).click();
  await expect(bubble).toHaveCount(0);

  // Same page, idle at the bottom again.
  await page.mouse.move(10, 10);
  await scrollToBottom(page);
  await page.waitForTimeout(IDLE_MS + 1000);
  await expect(bubble).toHaveCount(0);

  // New page load in the same tab.
  await page.reload();
  await page.waitForLoadState('load');
  await page.evaluate(() => window.docsAssistantEnsureMounted?.());
  await scrollToBottom(page);
  await page.waitForTimeout(IDLE_MS + 1000);
  await expect(bubble).toHaveCount(0);

  // A new tab starts a new session, and the dismissal still holds.
  const newTab = await page.context().newPage();

  await openLongPage(newTab, baseURL);
  await scrollToBottom(newTab);
  await newTab.waitForTimeout(IDLE_MS + 1000);
  await expect(newTab.locator('.da-proactive')).toHaveCount(0);
});

test('shows again on the next page load when the reader did not close it', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await scrollToBottom(page);

  const bubble = page.locator('.da-proactive');

  await expect(bubble).toBeVisible({ timeout: IDLE_MS + 3000 });

  await page.reload();
  await page.waitForLoadState('load');
  await page.evaluate(() => window.docsAssistantEnsureMounted?.());
  await expect(bubble).toHaveCount(0);
  await scrollToBottom(page);
  await expect(bubble).toBeVisible({ timeout: IDLE_MS + 3000 });
});

test('comes back after the chat it opened is closed', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await scrollToBottom(page);

  const bubble = page.locator('.da-proactive');

  await expect(bubble).toBeVisible({ timeout: IDLE_MS + 3000 });
  await page.locator('.da-proactive-ask').click();
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'true');
  await expect(bubble).toHaveCount(0);

  // Opening the chat only hides the bubble; it is not a dismissal.
  await page.getByRole('button', { name: 'Close assistant' }).click();
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'false');
  await scrollToBottom(page);
  await expect(bubble).toBeVisible({ timeout: IDLE_MS + 3000 });
});

test('"Ask AI" in the bubble opens the chat with a draft about the page', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await scrollToBottom(page);

  await expect(page.locator('.da-proactive')).toBeVisible({ timeout: IDLE_MS + 3000 });
  await page.locator('.da-proactive-ask').click();

  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.da-proactive')).toHaveCount(0);
  await expect(page.locator('.da-panel textarea')).toHaveValue(/I have a question about the ".+" page\./);
});

test('can be reached, named, and dismissed with the keyboard only', async ({ page, baseURL }) => {
  await openLongPage(page, baseURL);
  await scrollToBottom(page);

  const bubble = page.getByRole('region', { name: 'Docs assistant suggestion' });
  const askButton = bubble.getByRole('button', { name: /^Ask AI Questions about ".+"\?$/ });
  const dismissButton = bubble.getByRole('button', { name: 'Dismiss suggestion' });

  await expect(bubble).toBeVisible({ timeout: IDLE_MS + 3000 });

  // Tab in from the start of the page until focus reaches the bubble.
  let tabs = 0;
  let reached = false;

  while (!reached && tabs < 300) {
    await page.keyboard.press('Tab');
    tabs += 1;
    reached = await page.evaluate(() => !!document.activeElement?.closest('.da-proactive'));
  }

  expect(reached, 'Tab reaches the bubble').toBe(true);
  await expect(askButton).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(dismissButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(askButton).toBeFocused();

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(bubble).toHaveCount(0);
});
