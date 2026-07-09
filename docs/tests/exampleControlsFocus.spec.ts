import { test, expect } from '@playwright/test';

const PAGE = '/javascript-data-grid/saving-data/';
const THEMES = ['light', 'dark'] as const;

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

THEMES.forEach((theme) => {
  test(`example controls show an inset keyboard focus ring in ${theme} theme`, async({ page, baseURL }) => {
    await page.goto(`${baseURL}${PAGE}`);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await expect(page.getByText('Password protected site')).toHaveCount(0);
    await page.locator('html').evaluate((html, selectedTheme) => {
      html.setAttribute('data-theme', selectedTheme);
    }, theme);
    await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });

    const preview = page.locator('.hot-example-preview').first();
    const loadButton = preview.locator('#load');
    const saveButton = preview.locator('#save');

    await expect(loadButton).toBeVisible();
    await loadButton.hover();
    await loadButton.click();
    await page.keyboard.press('Tab');

    await expect(saveButton).toBeFocused();
    const focusStyles = await saveButton.evaluate((button) => {
      const styles = getComputedStyle(button);

      return {
        boxShadow: styles.boxShadow,
        outlineStyle: styles.outlineStyle,
      };
    });

    expect(focusStyles.outlineStyle).toBe('none');
    expect(focusStyles.boxShadow).toContain('inset');
  });
});
