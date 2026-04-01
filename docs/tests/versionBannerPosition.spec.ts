import { test, expect } from '@playwright/test';

const TEST_PATH = '/javascript-data-grid/numeric-cell-type/';

test.beforeEach(async({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || '');
  const extractedDomain = url.hostname;

  await page.context().addCookies([
    {
      name: 'CookieConsent',
      value: '-2',
      domain: extractedDomain,
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
});

test('renders the banner container before article content', async({ page, baseURL }) => {
  await page.goto(`${baseURL}${TEST_PATH}`);

  const order = await page.evaluate(() => {
    const pageElement = document.querySelector('main.page');
    const pageTop = pageElement?.querySelector(':scope > .page-top');
    const content = pageElement?.querySelector(':scope > .theme-default-content');

    if (!pageElement || !pageTop || !content) {
      return null;
    }

    const children = Array.from(pageElement.children);

    return {
      pageTopIndex: children.indexOf(pageTop),
      contentIndex: children.indexOf(content),
    };
  });

  expect(order).not.toBeNull();
  if (!order) {
    throw new Error('Expected both banner and article content containers to be present.');
  }
  expect(order.pageTopIndex).toBeGreaterThanOrEqual(0);
  expect(order.contentIndex).toBeGreaterThanOrEqual(0);
  expect(order.pageTopIndex).toBeLessThan(order.contentIndex);
});

test('shows old-version banner above article content when visible', async({ page, baseURL }) => {
  await page.goto(`${baseURL}${TEST_PATH}`);

  const pageTop = page.locator('main.page > .page-top');
  const banner = pageTop.locator('.version-alert');
  const isVisible = await pageTop.isVisible();

  test.skip(!isVisible, 'Banner is hidden on latest documentation pages.');
  await expect(banner).toContainText('There is a newer version of Handsontable available.');

  const positions = await page.evaluate(() => {
    const pageTopElement = document.querySelector('main.page > .page-top');
    const content = document.querySelector('main.page > .theme-default-content');

    if (!pageTopElement || !content) {
      return null;
    }

    return {
      pageTopOffset: pageTopElement.getBoundingClientRect().top,
      contentOffset: content.getBoundingClientRect().top,
    };
  });

  expect(positions).not.toBeNull();
  if (!positions) {
    throw new Error('Expected positions for both banner and article content containers.');
  }
  expect(positions.pageTopOffset).toBeLessThan(positions.contentOffset);
});
