import { test, expect } from '@playwright/test';

const PAGE_PATH = '/docs/javascript-data-grid/events-and-hooks/';

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

test.describe('Right-side table of contents keyboard navigation', () => {
  test('keeps focus in the TOC after clicking an entry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(PAGE_PATH);

    const toc = page.locator('.right-sidebar-panel starlight-toc');
    const tocLinks = toc.locator('a[href^="#"]:visible');
    const clickedLink = tocLinks.nth(0);
    const nextLink = tocLinks.nth(1);
    const thirdLink = tocLinks.nth(2);

    await expect(clickedLink).toBeVisible();
    await expect(nextLink).toBeVisible();
    await expect(thirdLink).toBeVisible();

    const clickedHref = await clickedLink.getAttribute('href');
    const nextHref = await nextLink.getAttribute('href');
    const thirdHref = await thirdLink.getAttribute('href');
    const activeTocHref = () => page.evaluate(() =>
      document.activeElement?.closest('.right-sidebar-panel starlight-toc a')?.getAttribute('href') ?? ''
    );

    await clickedLink.click();

    await expect.poll(activeTocHref).toBe(clickedHref);

    await page.keyboard.press('Tab');
    await expect.poll(activeTocHref).toBe(nextHref);

    await page.keyboard.press('ArrowDown');
    await expect.poll(activeTocHref).toBe(thirdHref);

    await page.keyboard.press('ArrowUp');
    await expect.poll(activeTocHref).toBe(nextHref);
  });
});
