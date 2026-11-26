import { test, expect, type Page } from '@playwright/test';

const PAGE_PATH = '/javascript-data-grid/installation/';
const TABLET = { width: 1000, height: 800 };
const DESKTOP = { width: 1440, height: 900 };
const TOGGLE = '.mobile-sidebar-toggle';
const PANE = '.sidebar-pane';

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

  await page.setViewportSize(TABLET);
  await page.goto(`${baseURL}${PAGE_PATH}`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await expect(page.getByText('Password protected site')).toHaveCount(0);
  await page.waitForLoadState('load');
});

/**
 * Presses Tab from the sidebar toggle and collects where the focus lands.
 *
 * @param page The page.
 * @param presses How many times to press Tab.
 * @returns For each press, whether the focused element is inside the sidebar pane.
 */
async function tabStopsInPane(page: Page, presses: number): Promise<boolean[]> {
  const stops: boolean[] = [];

  await page.locator(TOGGLE).focus();

  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('Tab');
    stops.push(await page.evaluate(selector => Boolean(document.activeElement?.closest(selector)), PANE));
  }

  return stops;
}

test.describe('Sidebar collapsed at tablet width', () => {
  test('is skipped by Tab when collapsed and reached again after expanding', async({ page }) => {
    const toggle = page.locator(TOGGLE);
    const pane = page.locator(PANE);

    await expect(toggle).toBeVisible();
    await expect(pane).not.toHaveAttribute('aria-hidden', /.*/);
    expect(await pane.evaluate((element: HTMLElement) => element.inert)).toBe(false);
    expect((await tabStopsInPane(page, 40)).some(Boolean)).toBe(true);

    await toggle.focus();
    await page.keyboard.press('Enter');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(pane).toHaveAttribute('aria-hidden', 'true');
    expect(await pane.evaluate((element: HTMLElement) => element.inert)).toBe(true);
    expect(await tabStopsInPane(page, 40)).not.toContain(true);

    await toggle.focus();
    await page.keyboard.press('Enter');

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(pane).not.toHaveAttribute('aria-hidden', /.*/);
    expect(await pane.evaluate((element: HTMLElement) => element.inert)).toBe(false);
    expect((await tabStopsInPane(page, 40)).some(Boolean)).toBe(true);
  });

  test('gives the sidebar back when the window leaves the tablet range while collapsed', async({ page }) => {
    const toggle = page.locator(TOGGLE);
    const pane = page.locator(PANE);

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(pane).toHaveAttribute('aria-hidden', 'true');

    await page.setViewportSize(DESKTOP);

    await expect(pane).toBeVisible();
    await expect(pane).not.toHaveAttribute('aria-hidden', /.*/);
    expect(await pane.evaluate((element: HTMLElement) => element.inert)).toBe(false);

    await page.setViewportSize(TABLET);

    await expect(pane).toHaveAttribute('aria-hidden', 'true');
    expect(await pane.evaluate((element: HTMLElement) => element.inert)).toBe(true);
  });

  test('moves the focus to the toggle when the window narrows into the tablet range with the focus in the sidebar', async({ page }) => {
    const toggle = page.locator(TOGGLE);
    const pane = page.locator(PANE);
    const sidebarLink = pane.locator('a[href]').first();

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(pane).toHaveAttribute('aria-hidden', 'true');

    await page.setViewportSize(DESKTOP);
    await expect(pane).not.toHaveAttribute('aria-hidden', /.*/);
    await sidebarLink.focus();
    await expect(sidebarLink).toBeFocused();

    await page.setViewportSize(TABLET);

    await expect(pane).toHaveAttribute('aria-hidden', 'true');
    await expect(toggle).toBeFocused();
  });
});
