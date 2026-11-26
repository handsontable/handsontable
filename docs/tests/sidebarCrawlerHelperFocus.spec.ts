import { test, expect } from '@playwright/test';

const PAGES = [
  '/javascript-data-grid/installation/',
  '/javascript-data-grid/api/core/',
];
const HELPER_LINK = '.sidebar-links a.active';

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

PAGES.forEach((pagePath) => {
  test.describe(`Off-screen search crawler copy of the navigation on ${pagePath}`, () => {
    test.beforeEach(async({ page, baseURL }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${baseURL}${pagePath}`);
      await expect(page.getByText('Page not found (404)')).toHaveCount(0);
      await expect(page.getByText('Password protected site')).toHaveCount(0);
    });

    test('keeps the page label and link the crawler reads', async({ page }) => {
      const helperLink = page.locator(HELPER_LINK);

      await expect(helperLink).toHaveCount(1);
      await expect(helperLink).toHaveText(/\S/);
      await expect(helperLink).toHaveAttribute('href', new RegExp(`${pagePath}$`));
    });

    test('is skipped by Tab', async({ page }) => {
      const helperLink = page.locator(HELPER_LINK);

      await expect(helperLink).toHaveCount(1);

      const stopBeforeHelper = await page.evaluateHandle((selector) => {
        const helper = document.querySelector(selector) as HTMLElement;
        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, [tabindex]')
        );

        return candidates.filter(element => element.tabIndex >= 0
          && !element.matches(':disabled')
          && !element.closest('[inert]')
          && element.checkVisibility({ visibilityProperty: true })
          && Boolean(helper.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING)).pop() ?? null;
      }, HELPER_LINK);
      const previousStop = stopBeforeHelper.asElement();

      expect(previousStop).not.toBeNull();

      await previousStop!.focus();
      expect(await previousStop!.evaluate(element => element === document.activeElement)).toBe(true);

      await page.keyboard.press('Tab');

      await expect(helperLink).not.toBeFocused();
      expect(await previousStop!.evaluate(element => element === document.activeElement)).toBe(false);
    });

    test('cannot take the focus from a script', async({ page }) => {
      const helperLink = page.locator(HELPER_LINK);

      await expect(helperLink).toHaveCount(1);
      await helperLink.evaluate((element: HTMLElement) => element.focus());

      await expect(helperLink).not.toBeFocused();
    });
  });
});
