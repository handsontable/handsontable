import { test, expect } from '@playwright/test';

/**
 * The ARIA grid recipe adds `aria-sort="none"` to column headers that have none. The corner above the
 * row headers is a plain grid cell, and `aria-sort` is not allowed on a grid cell (axe
 * `aria-allowed-attr`), so the recipe must leave the corner alone.
 */

const FRAMEWORKS = ['javascript', 'react', 'angular'] as const;

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
  await page.addInitScript(() => {
    localStorage.setItem('hot-docs-chat-open', 'false');
  });
});

for (const framework of FRAMEWORKS) {
  test(`the ${framework} ARIA grid recipe leaves aria-sort off the corner header`, async({ page, baseURL }) => {
    await page.goto(`${baseURL}/${framework}-data-grid/recipes/accessibility/aria-grid/`);

    const example = page.locator('.hot-example').filter({ has: page.locator('.handsontable') }).first();
    const columnHeaders = example.locator('.ht_clone_top thead th:not(.htLastRowHeaderColumn)');
    const corners = example.locator('thead th.htLastRowHeaderColumn');

    await expect(columnHeaders.first()).toHaveAttribute('aria-sort', 'none');
    await expect(corners.first()).toBeAttached();

    expect(await corners.evaluateAll(cells => cells.filter(cell => cell.hasAttribute('aria-sort')).length)).toBe(0);
  });
}
