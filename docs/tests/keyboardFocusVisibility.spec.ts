import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1280, height: 800 };
const TOC_LINK = '.right-sidebar a[href^="#"]';
const EXAMPLE_BUTTONS = ['button#sort', '.hot-example-source-btn', '.hot-example-runner-btn', '.hot-example-github-btn'];

/**
 * Focuses the tab stop right before the first element that matches the selector, then presses Tab once,
 * so the element takes the focus from the keyboard.
 *
 * @param {Page} page The page.
 * @param {string} selector The selector of the element to reach.
 */
async function tabInto(page: Page, selector: string): Promise<void> {
  const ready = await page.evaluate((sel) => {
    const target = document.querySelector<HTMLElement>(sel);
    const stops = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')]
      .filter(element => element.tabIndex >= 0 && !element.hasAttribute('disabled') && element.getClientRects().length > 0);
    const index = target ? stops.indexOf(target) : -1;

    if (index < 1) {
      return false;
    }
    stops[index - 1].focus();

    return true;
  }, selector);

  expect(ready, `a tab stop comes before ${selector}`).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.locator(selector).first()).toBeFocused();
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

      await tabInto(page, '.expressive-code .copy button');

      const focused = page.locator('.expressive-code .copy button:focus-visible');

      await expect(focused).toHaveCount(1);
      await expect(focused).toHaveCSS('opacity', '1');
      await expect(focused).toHaveCSS('outline-style', 'solid');
      await expect(focused).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
      await expect(focused).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    });

    test(`example buttons draw one focus ring (${theme})`, async({ page, baseURL }) => {
      await page.goto(`${baseURL}/javascript-data-grid/rows-sorting/`);
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      await page.mouse.move(0, 0);

      for (const selector of EXAMPLE_BUTTONS) {
        const button = page.locator(selector).first();

        await tabInto(page, selector);

        await expect(page.locator(`${selector}:focus-visible`).first()).toBeFocused();
        await expect(button, selector).toHaveCSS('outline-style', 'none');
        await expect(button, selector).toHaveCSS('box-shadow', /inset/);
      }
    });
  }

  test('the copy button changes on hover in the dark theme', async({ page, baseURL }) => {
    await page.goto(`${baseURL}/javascript-data-grid/bundle-size/`);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    const codeBlock = page.locator('.expressive-code figure').first();
    const copyButton = codeBlock.locator('.copy button');

    await codeBlock.hover({ position: { x: 10, y: 10 } });
    await expect(copyButton).toHaveCSS('opacity', '1');

    const rest = await copyButton.evaluate(button => getComputedStyle(button).backgroundColor);

    await copyButton.hover();

    await expect(copyButton).not.toHaveCSS('background-color', rest);
  });

  test('Shift+Tab keeps a table of contents link below the fixed header', async({ page, baseURL }) => {
    await page.goto(`${baseURL}/javascript-data-grid/rows-sorting/`);
    await page.mouse.move(0, 0);

    const setup = await page.evaluate((selector) => {
      const sidebar = document.querySelector<HTMLElement>('.right-sidebar');
      const links = [...document.querySelectorAll<HTMLAnchorElement>(selector)]
        .filter(link => link.getClientRects().length > 0);

      if (!sidebar || links.length < 3 || sidebar.scrollHeight <= sidebar.clientHeight) {
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
