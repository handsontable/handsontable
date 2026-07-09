import { test, expect, type Locator } from '@playwright/test';

const TOLERANCE_PX = 1;

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
      sameSite: 'Lax',
    },
    {
      name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
      value: process.env.PASS_COOKIE ? process.env.PASS_COOKIE : '',
      domain: 'dev.handsontable.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
});

async function expectNoFalseHorizontalOverflow(locator: Locator) {
  await expect(locator).toBeVisible();

  const overflow = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + TOLERANCE_PX);
}

test('short API code snippets do not show false horizontal scrollbars', async({ page, baseURL }) => {
  await page.goto(`${baseURL}/javascript-data-grid/api/options`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await expect(page.getByText('Password protected site')).toHaveCount(0);

  const shortSnippet = page
    .locator('.expressive-code pre')
    .filter({ hasText: 'allowEmpty: true' })
    .first();

  await expectNoFalseHorizontalOverflow(shortSnippet);
});

test('interactive example source panels do not force horizontal scrollbars for fitting code', async({
  page,
  baseURL,
}) => {
  await page.goto(`${baseURL}/javascript-data-grid/column-menu`);
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await expect(page.getByText('Password protected site')).toHaveCount(0);
  await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });

  await page.locator('.hot-example-source-btn').first().click();

  const visibleSourcePanel = page.locator('.hot-example-code:not([hidden])').first();

  await expectNoFalseHorizontalOverflow(visibleSourcePanel);
});
