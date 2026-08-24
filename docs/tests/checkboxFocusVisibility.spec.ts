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
  test(`checked example checkbox shows a visible keyboard focus ring in ${theme} theme`, async({ page, baseURL }) => {
    await page.goto(`${baseURL}${PAGE}`);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await expect(page.getByText('Password protected site')).toHaveCount(0);
    await page.locator('html').evaluate((html, selectedTheme) => {
      html.setAttribute('data-theme', selectedTheme);
    }, theme);
    await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });

    const preview = page.locator('.hot-example-preview').first();
    const saveButton = preview.locator('#save');
    const autosaveCheckbox = preview.locator('#autosave');

    await expect(saveButton).toBeVisible();
    await expect(autosaveCheckbox).toBeVisible();
    await expect(preview.locator('.handsontable #autosave')).toHaveCount(0);

    await autosaveCheckbox.check();
    await saveButton.focus();
    await page.keyboard.press('Tab');

    await expect(autosaveCheckbox).toBeFocused();
    const focusStyles = await autosaveCheckbox.evaluate((checkbox) => {
      const styles = getComputedStyle(checkbox);

      return {
        boxShadow: styles.boxShadow,
        outlineOffset: styles.outlineOffset,
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
      };
    });

    expect(focusStyles.outlineStyle).toBe('solid');
    expect(focusStyles.outlineWidth).toBe('2px');
    expect(focusStyles.boxShadow).not.toBe('none');
    expect(focusStyles.outlineOffset).toBe('0px');
  });
});
