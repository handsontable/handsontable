import { test, expect, type Page } from '@playwright/test';

/**
 * WCAG 2.5.3 Label in Name: the header controls a voice-control user calls by
 * their visible text must carry that text in their accessible name. The
 * framework switcher's tabs and the "Ask AI" button had names that did not
 * contain it ("Switch to JavaScript" on a tab that reads "JS", "Open docs
 * assistant" on a button that reads "Ask AI").
 */

const PAGE = '/javascript-data-grid/';
const TABS = ['JS', 'React', 'Angular', 'Vue'];

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
  await page.addInitScript(() => {
    localStorage.setItem('hot-docs-chat-open', 'false');
  });
});

/**
 * Opens the docs page at the given viewport width and waits until the header
 * init script has bound the Ask AI buttons.
 */
async function openAt(page: Page, baseURL: string | undefined, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(`${baseURL}${PAGE}`);
  await page.waitForLoadState('load');
  await expect(page.locator('body > #mobile-nav-overlay')).toBeAttached();
}

test('names each framework tab by its visible text', async ({ page, baseURL }) => {
  await openAt(page, baseURL, 1280);

  const switcher = page.getByRole('group', { name: 'Framework' });

  for (const name of TABS) {
    const tab = switcher.getByRole('link', { name, exact: true });

    await expect(tab).toBeVisible();
    await expect(tab).toHaveText(name);
  }

  await expect(switcher.getByRole('link', { name: 'JS', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('keeps the framework tab names when the header shows icons only', async ({ page, baseURL }) => {
  await openAt(page, baseURL, 860);

  const switcher = page.getByRole('group', { name: 'Framework' });

  for (const name of TABS) {
    const tab = switcher.getByRole('link', { name, exact: true });

    await expect(tab).toBeVisible();
    await expect(tab.locator('.fw-tab-label')).toHaveCSS('position', 'absolute');
  }
});

test('names the "Ask AI" button by its visible text and opens the assistant from the keyboard', async ({ page, baseURL }) => {
  await openAt(page, baseURL, 1280);

  const askAi = page.locator('#header-assistant-btn');
  const panel = page.locator('.da-panel');

  await expect(askAi).toBeVisible();
  await expect(askAi).toHaveAccessibleName('Ask AI');
  await expect(askAi).toHaveAttribute('title', 'Ask AI');
  await expect(page.getByRole('button', { name: 'Ask AI', exact: true })).toBeVisible();

  await askAi.focus();
  await expect(askAi).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-open', 'true');
});

test('gives the phone header\'s assistant button the same name', async ({ page, baseURL }) => {
  await openAt(page, baseURL, 390);

  const askAi = page.locator('#mobile-assistant-btn');

  await expect(askAi).toBeVisible();
  await expect(askAi).toHaveAccessibleName('Ask AI');
  await expect(askAi).toHaveAttribute('title', 'Ask AI');
});
