import { test, expect, type Page } from '@playwright/test';

/**
 * Header "Playground" link (DEV-2046).
 *
 * The desktop navigation links to the demo runner after Support, as an external link.
 * Adding it made the row too wide on tablets, so it also checks that the row keeps the
 * version selector inside the header at every desktop-navigation width.
 */

const PLAYGROUND_URL = 'https://demos.handsontable.com';

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

async function openIntroduction(page: Page, baseURL: string | undefined): Promise<void> {
  await page.goto(`${baseURL}/javascript-data-grid/`);
  await page.waitForLoadState('load');
}

test('the desktop navigation links to the demo runner after Support, in a new window', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openIntroduction(page, baseURL);

  const nav = page.getByRole('navigation', { name: 'Main navigation' }).first();
  const link = nav.getByRole('link', { name: 'Playground (opens in new window)' });

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', PLAYGROUND_URL);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);

  // It sits right after the Support dropdown.
  const followsSupport = await link.evaluate(a => a.previousElementSibling?.classList.contains('support-dropdown')
    || a.previousElementSibling?.previousElementSibling?.classList.contains('support-dropdown'));

  expect(followsSupport, 'Playground follows the Support dropdown').toBe(true);
});

test('the mobile menu links to the demo runner too', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openIntroduction(page, baseURL);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();

  const link = page.locator('#mobile-nav-overlay').getByRole('link', { name: 'Playground (opens in new window)' });

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', PLAYGROUND_URL);
  await expect(link).toHaveAttribute('target', '_blank');
});

// 800px is where the desktop navigation starts; 820px and 834px are iPads in portrait;
// the others sit on each side of the breakpoints that compact the row.
for (const width of [800, 820, 834, 919, 920, 1024, 1119, 1120, 1199, 1200]) {
  test(`the navigation row keeps the version selector inside the header at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 900 });
    await openIntroduction(page, baseURL);

    const overflow = await page.evaluate(() => {
      const nav = document.querySelector('.header-row-2') as HTMLElement;
      const style = getComputedStyle(nav);
      const innerRight = nav.getBoundingClientRect().right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
      const versions = document.querySelector('.versions-dropdown') as HTMLElement;

      return versions.getBoundingClientRect().right - innerRight;
    });

    expect(overflow, 'pixels the version selector sticks out of the row').toBeLessThanOrEqual(0.5);
  });
}
