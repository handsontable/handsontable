import { test, expect, type Page } from '@playwright/test';

const PAGE_PATH = '/javascript-data-grid/installation/';
const TABLET = { width: 1000, height: 800 };
const PHONE = { width: 390, height: 844 };
const TOGGLE = '.mobile-sidebar-toggle';
const TOC_TOGGLE = '.mobile-toc-toggle';
const PANE = '.sidebar-pane';
const BREADCRUMBS = '.mobile-breadcrumbs';

test.beforeEach(async({ page, baseURL }) => {
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
 * Opens the guide page at the given viewport and waits until the header script has run.
 *
 * @param page The page.
 * @param baseURL The docs base URL.
 * @param viewport The viewport to load the page in.
 */
async function openPage(page: Page, baseURL: string | undefined, viewport: { width: number, height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseURL}${PAGE_PATH}`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await expect(page.getByText('Password protected site')).toHaveCount(0);
  await page.waitForLoadState('load');
  await expect(page.locator(BREADCRUMBS)).not.toBeEmpty();
}

/**
 * Reads the right edge of the sidebar pane, which is 0 when the pane is slid off screen.
 *
 * @param page The page.
 * @returns The right edge in pixels.
 */
async function paneRightEdge(page: Page): Promise<number> {
  return page.locator(PANE).evaluate(element => Math.round(element.getBoundingClientRect().right));
}

/**
 * Tells whether nothing on the page has the focus.
 *
 * @param page The page.
 * @returns `true` when the focus is on the document body.
 */
async function focusIsOnBody(page: Page): Promise<boolean> {
  return page.evaluate(() => document.activeElement === document.body);
}

test.describe('Sidebar toggle at tablet width', () => {
  test('reports the open sidebar on load and leaves the focus where the browser puts it', async({ page, baseURL }) => {
    await openPage(page, baseURL, TABLET);

    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'true');
    expect(await paneRightEdge(page)).toBeGreaterThan(0);
    expect(await focusIsOnBody(page)).toBe(true);
  });

  test('keeps the focus on the toggle and reports each state across two presses', async({ page, baseURL }) => {
    await openPage(page, baseURL, TABLET);
    const toggle = page.locator(TOGGLE);

    await toggle.focus();
    await page.keyboard.press('Enter');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect.poll(() => paneRightEdge(page)).toBeLessThanOrEqual(0);

    await page.keyboard.press('Enter');

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toBeFocused();
    await expect.poll(() => paneRightEdge(page)).toBeGreaterThan(0);
  });

  test('keeps the focus on the toggle when it closes an open table of contents', async({ page, baseURL }) => {
    await openPage(page, baseURL, TABLET);
    const toggle = page.locator(TOGGLE);
    const tocToggle = page.locator(TOC_TOGGLE);

    await tocToggle.click();
    await expect(tocToggle).toHaveAttribute('aria-expanded', 'true');

    await toggle.click();

    await expect(tocToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('reports the open sidebar after the window grows into the tablet range', async({ page, baseURL }) => {
    await openPage(page, baseURL, PHONE);
    const toggle = page.locator(TOGGLE);

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await page.setViewportSize(TABLET);

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Header controls at phone width', () => {
  test('leave the focus where the browser puts it on load', async({ page, baseURL }) => {
    await openPage(page, baseURL, PHONE);

    expect(await focusIsOnBody(page)).toBe(true);
  });
});
