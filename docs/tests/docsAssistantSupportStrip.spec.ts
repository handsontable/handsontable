import { test, expect, type Page } from '@playwright/test';

/**
 * Docs assistant "Writing to Support" strip (SU-1162).
 *
 * After a Support reply, "Reply to Support" puts a strip on top of the input. The strip has
 * a "Back to bot" button and a close button, and both return the input to the bot. These tests
 * cover what a keyboard reader needs: the accessible names, the tab order, that each button
 * works from the keyboard, and that focus goes back to the input afterwards.
 *
 * The backend is replaced with fixed answers, so the tests need no network and no Slack:
 * `/api/chat` opens a conversation thread with a poll token, and `/api/agent-replies` returns
 * one Support reply, which is what makes the "Reply to Support" button appear.
 */

const PAGE = '/javascript-data-grid/';
const STRIP_TITLE = 'Writing to Support';
const BACK_BUTTON = 'Back to bot';
const CLOSE_BUTTON = 'Stop writing to Support';
const BACK_NOTICE = 'You are replying to the bot again';
// A Slack timestamp is the conversation id; a fresh one never counts as an old conversation.
const THREAD_SECONDS = Math.floor(Date.now() / 1000);
const THREAD_ID = `${THREAD_SECONDS}.000100`;
const REPLY_ID = `${THREAD_SECONDS}.000200`;

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
  await page.setViewportSize({ width: 1440, height: 900 });
});

/**
 * Answers the two backend routes the panel calls. The patterns end in the route name, so they
 * match both the same-origin proxy path and the absolute backend address.
 */
async function stubBackend(page: Page): Promise<void> {
  const frames = [
    { type: 'message_start', thread_id: THREAD_ID, agent_token: 'test-token' },
    { type: 'content_chunk', delta: { content: 'Register it as a function plugin.' } },
    { type: 'message_end' },
  ];

  await page.route('**/api/chat', (route) => route.fulfill({
    status: 200,
    headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' },
    body: frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(''),
  }));
  await page.route('**/api/agent-replies', (route) => route.fulfill({
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ messages: [{ id: REPLY_ID, text: 'Hi, this is Support.' }] }),
  }));
}

/**
 * Opens the panel, asks one question, waits for the Support reply, and clicks "Reply to Support".
 */
async function openSupportStrip(page: Page, baseURL: string | undefined): Promise<void> {
  await stubBackend(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hot-docs-chat-open', 'true');
    } catch {
      // localStorage may be unavailable; the widget defaults to closed.
    }
  });
  await page.goto(`${baseURL}${PAGE}`);
  await page.waitForLoadState('load');
  await page.evaluate(() => window.docsAssistantEnsureMounted?.());
  await expect(page.locator('.da-panel')).toHaveAttribute('data-open', 'true');

  const input = page.locator('.da-input');

  await input.fill('How do I register a custom function?');
  await input.press('Enter');
  await expect(page.locator('.da-msg-agent')).toBeVisible();
  await page.getByRole('button', { name: 'Reply to Support' }).click();
  await expect(page.locator('.da-support-strip')).toBeVisible();
}

test('names the strip and its two buttons', async ({ page, baseURL }) => {
  await openSupportStrip(page, baseURL);

  const strip = page.locator('.da-support-strip');

  await expect(strip.getByText(STRIP_TITLE)).toBeVisible();
  await expect(strip.getByRole('button', { name: BACK_BUTTON })).toBeVisible();
  await expect(strip.getByRole('button', { name: CLOSE_BUTTON })).toBeVisible();
  // The input is named for Support too, so a screen reader hears where the message goes.
  await expect(page.getByRole('textbox', { name: 'Write to Support' })).toBeVisible();
});

test('puts the focus frame around the strip and the input together', async ({ page, baseURL }) => {
  await openSupportStrip(page, baseURL);
  await expect(page.locator('.da-input')).toBeFocused();

  // The frame is drawn by the wrapper while the strip is shown, and the input draws none.
  await expect(page.locator('.da-input-wrap')).toHaveCSS('box-shadow', /inset/);
  await expect(page.locator('.da-input')).toHaveCSS('box-shadow', 'none');
});

test('reaches the strip buttons by Shift+Tab from the input, in reading order', async ({ page, baseURL }) => {
  await openSupportStrip(page, baseURL);

  const strip = page.locator('.da-support-strip');

  // "Reply to Support" focuses the input. Backwards from it: the close button, then "Back to bot".
  await expect(page.locator('.da-input')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(strip.getByRole('button', { name: CLOSE_BUTTON })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(strip.getByRole('button', { name: BACK_BUTTON })).toBeFocused();
});

test('"Back to bot" works from the keyboard and returns the focus to the input', async ({ page, baseURL }) => {
  await openSupportStrip(page, baseURL);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: BACK_BUTTON })).toBeFocused();

  await page.keyboard.press('Enter');

  await expect(page.locator('.da-support-strip')).toHaveCount(0);
  await expect(page.locator('.da-input')).toBeFocused();
  await expect(page.locator('.da-support-notice')).toHaveText(BACK_NOTICE);
});

test('the close button works from the keyboard and returns the focus to the input', async ({ page, baseURL }) => {
  await openSupportStrip(page, baseURL);
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: CLOSE_BUTTON })).toBeFocused();

  await page.keyboard.press('Space');

  await expect(page.locator('.da-support-strip')).toHaveCount(0);
  await expect(page.locator('.da-input')).toBeFocused();
  await expect(page.locator('.da-support-notice')).toHaveText(BACK_NOTICE);
});
