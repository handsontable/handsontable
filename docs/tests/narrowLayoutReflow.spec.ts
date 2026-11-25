import { test, expect, type Page } from '@playwright/test';

const PHONE_320 = { width: 320, height: 256 };
const ZOOM_200 = { width: 640, height: 512 };

/**
 * Reads how far the page reaches past the viewport's right edge. Zero means the page reads with one
 * scroll direction (WCAG 1.4.10).
 *
 * @param {Page} page The page.
 * @returns {Promise<number>} The overflow in CSS px.
 */
async function sidewaysOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
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
});

test.describe('docs layout at 320 CSS px and at 200% zoom', () => {
  test('the phone breadcrumbs wrap, and the page starts below the sub-bar they make taller', async({ page, baseURL }) => {
    await page.setViewportSize(PHONE_320);
    await page.goto(`${baseURL}/angular-data-grid/accessibility/`);

    const breadcrumbs = page.locator('.mobile-breadcrumbs');

    await expect(breadcrumbs).toContainText('Accessibility and navigation / Accessibility');
    await expect(breadcrumbs).not.toHaveCSS('text-overflow', 'ellipsis');

    await expect.poll(() => page.evaluate(() => {
      const crumbs = document.querySelector<HTMLElement>('.mobile-breadcrumbs')!;
      const bar = document.querySelector<HTMLElement>('.mobile-subheader')!.getBoundingClientRect();
      const frame = document.querySelector<HTMLElement>('.main-frame')!;

      return {
        textFits: crumbs.scrollWidth <= crumbs.clientWidth,
        wrapped: crumbs.getClientRects()[0].height > parseFloat(getComputedStyle(crumbs).lineHeight) * 1.5,
        barInsideViewport: bar.right <= document.documentElement.clientWidth,
        contentStartsBelowBar: Math.abs(parseFloat(getComputedStyle(frame).paddingTop) - bar.bottom) <= 1,
      };
    })).toEqual({ textFits: true, wrapped: true, barInsideViewport: true, contentStartsBelowBar: true });
    expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('card titles wrap instead of ending in an ellipsis', async({ page, baseURL }) => {
    await page.setViewportSize(ZOOM_200);
    await page.goto(`${baseURL}/javascript-data-grid/column-hiding/`);

    const titles = page.locator('.ht-link-card .title');

    await expect(titles.first()).toBeVisible();

    const cut = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.ht-link-card .title')]
      .filter((title) => {
        const link = title.closest('a')!;
        const range = document.createRange();

        range.selectNodeContents(title);

        return getComputedStyle(title).textOverflow === 'ellipsis' || range.getBoundingClientRect().right > link.getBoundingClientRect().right + 1;
      })
      .map(title => title.textContent));

    expect(cut).toEqual([]);
  });

  test('the footer links sit side by side without overlapping, inside the page', async({ page, baseURL }) => {
    await page.setViewportSize(ZOOM_200);
    await page.goto(`${baseURL}/javascript-data-grid/api/core/`);

    const overlaps = await page.evaluate(() => {
      const boxes = [...document.querySelectorAll<HTMLElement>('.hot-footer__nav a')].map(link => [link.textContent?.trim(), link.getBoundingClientRect()] as const);
      const pairs: string[] = [];

      boxes.forEach(([nameA, a], index) => boxes.slice(index + 1).forEach(([nameB, b]) => {
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

        if (width > 1 && height > 1) {
          pairs.push(`${nameA} × ${nameB}`);
        }
      }));

      return { pairs, count: boxes.length, right: Math.max(...boxes.map(([, box]) => box.right)) };
    });

    expect(overlaps.count).toBe(6);
    expect(overlaps.pairs).toEqual([]);
    expect(overlaps.right).toBeLessThanOrEqual(ZOOM_200.width);

    await page.setViewportSize(PHONE_320);
    expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  });

  for (const [what, path] of [
    ['keys in prose', 'javascript-data-grid/formula-calculation/'],
    ['inline code in a callout', 'javascript-data-grid/autocomplete-cell-type/'],
    ['the not-found page\'s game', 'javascript-data-grid/page-that-does-not-exist/'],
  ]) {
    test(`${what} fit at 320 CSS px`, async({ page, baseURL }) => {
      await page.setViewportSize(PHONE_320);
      await page.goto(`${baseURL}/${path}`);
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();

      expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test('the hook names in the events example wrap instead of ending in an ellipsis', async({ page, baseURL }) => {
    await page.setViewportSize(PHONE_320);
    await page.goto(`${baseURL}/javascript-data-grid/events-and-hooks/`);

    const labels = page.locator('#hooksList li label');

    await expect(labels.first()).toBeVisible();

    const cut = await labels.evaluateAll(all => all
      .filter(label => getComputedStyle(label).textOverflow === 'ellipsis' || label.scrollWidth > label.clientWidth + 1)
      .map(label => label.textContent?.trim()));

    expect(cut).toEqual([]);
  });

  test('an example\'s own output text wraps inside the example', async({ page, baseURL }) => {
    await page.setViewportSize(PHONE_320);
    await page.goto(`${baseURL}/javascript-data-grid/metadata-and-inheritance/`);

    const output = page.locator('#example1-output');

    await expect(output).toContainText('Select a cell to see where its values come from.');

    const fits = await output.evaluate((element) => {
      const example = element.closest('.hot-example')!.getBoundingClientRect();
      const range = document.createRange();

      range.selectNodeContents(element);

      return range.getBoundingClientRect().right <= example.right + 1;
    });

    expect(fits).toBe(true);
  });
});
