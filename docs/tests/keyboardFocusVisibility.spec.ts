import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1280, height: 800 };
const TOC_LINK = '.right-sidebar a[href^="#"]';

/**
 * Presses Tab until the focus lands on an element that matches the selector.
 *
 * @param {Page} page The page.
 * @param {string} selector The selector of the element to reach.
 * @returns {Promise<boolean>} Whether the focus reached the element.
 */
async function tabTo(page: Page, selector: string): Promise<boolean> {
  for (let press = 0; press < 400; press += 1) {
    await page.keyboard.press('Tab');

    if (await page.evaluate(sel => document.activeElement?.matches(sel) ?? false, selector)) {
      return true;
    }
  }

  return false;
}

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
  await page.setViewportSize(DESKTOP);
});

test.describe('keyboard focus on the docs theme', () => {
  for (const theme of ['light', 'dark']) {
    test(`a code block's copy button shows when it has the keyboard focus (${theme})`, async({ page, baseURL }) => {
      await page.goto(`${baseURL}/javascript-data-grid/bundle-size/`);
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      await page.mouse.move(0, 0);

      const copyButton = page.locator('.expressive-code .copy button').first();

      await expect(copyButton).toHaveCSS('opacity', '0');

      expect(await tabTo(page, '.expressive-code .copy button')).toBe(true);

      const focused = page.locator('.expressive-code .copy button:focus-visible');

      await expect(focused).toHaveCount(1);
      await expect(focused).toHaveCSS('opacity', '1');
      await expect(focused).toHaveCSS('outline-style', 'solid');
      await expect(focused).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
      await expect(focused).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    });

    test(`an example control button draws one focus ring (${theme})`, async({ page, baseURL }) => {
      await page.goto(`${baseURL}/javascript-data-grid/rows-sorting/`);
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      await page.mouse.move(0, 0);

      const sortButton = page.locator('button#sort').first();

      await sortButton.scrollIntoViewIfNeeded();
      await sortButton.focus();

      await expect(page.locator('button#sort:focus-visible')).toHaveCount(1);
      await expect(sortButton).toHaveCSS('outline-style', 'none');
      await expect(sortButton).toHaveCSS('box-shadow', /inset/);
    });
  }

  test('Shift+Tab keeps a table of contents link below the fixed header', async({ page, baseURL }) => {
    await page.goto(`${baseURL}/javascript-data-grid/rows-sorting/`);
    await page.mouse.move(0, 0);

    const setup = await page.evaluate((selector) => {
      const sidebar = document.querySelector<HTMLElement>('.right-sidebar');
      const links = [...document.querySelectorAll<HTMLAnchorElement>(selector)]
        .filter(link => link.getClientRects().length > 0);

      if (!sidebar || links.length < 2 || sidebar.scrollHeight <= sidebar.clientHeight) {
        return null;
      }

      document.documentElement.style.scrollBehavior = 'auto';
      sidebar.style.scrollBehavior = 'auto';

      const index = Math.floor(links.length / 2);
      const headerBottom = document.querySelector('header.header')!.getBoundingClientRect().bottom;

      sidebar.scrollTop += links[index].getBoundingClientRect().top - 8;

      const linkTop = links[index].getBoundingClientRect().top;

      links[index].dataset.focusTarget = 'previous';
      links[index + 1].focus({ preventScroll: true });

      return { linkTop, headerBottom };
    }, TOC_LINK);

    expect(setup, 'the table of contents scrolls').not.toBeNull();
    expect(setup!.linkTop, 'the link starts behind the header').toBeLessThan(setup!.headerBottom);

    const previousLink = page.locator('[data-focus-target="previous"]');

    await page.keyboard.press('Shift+Tab');

    await expect(previousLink).toBeFocused();

    const placement = await page.evaluate(() => {
      const link = document.querySelector('[data-focus-target="previous"]')!.getBoundingClientRect();
      const header = document.querySelector('header.header')!.getBoundingClientRect();

      return { linkTop: link.top, headerBottom: header.bottom };
    });

    expect(placement.linkTop).toBeGreaterThanOrEqual(placement.headerBottom);
  });
});
