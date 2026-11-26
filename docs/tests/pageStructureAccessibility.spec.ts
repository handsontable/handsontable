import { test, expect } from '@playwright/test';

/**
 * WCAG 1.3.1 and 2.4.2 on the docs pages: a callout is a note, not a complementary
 * landmark, so the landmark list does not repeat "Tip" once per callout; the not-found
 * page's title holds its heading; and the framework variants of one page have titles
 * of their own, so a tab or a history list can tell them apart.
 */

const FRAMEWORKS = [
  { prefix: 'javascript-data-grid', name: 'JavaScript' },
  { prefix: 'react-data-grid', name: 'React' },
  { prefix: 'angular-data-grid', name: 'Angular' },
  { prefix: 'vue-data-grid', name: 'Vue' },
];

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

test('exposes each callout as a note named by its title, not as a landmark', async({ page, baseURL }) => {
  await page.goto(`${baseURL}/javascript-data-grid/security/`);

  const main = page.getByRole('main');

  await expect(main.getByRole('note', { name: 'Tip', exact: true })).toBeVisible();
  await expect(main.getByRole('note', { name: 'XSS risk', exact: true })).toBeVisible();
  await expect(main.getByRole('complementary')).toHaveCount(0);
  await expect(main.locator('aside.starlight-aside')).toHaveCount(0);
});

test('names the not-found page after its heading', async({ page, baseURL }) => {
  await page.goto(`${baseURL}/javascript-data-grid/this-page-does-not-exist/`);

  const heading = page.getByRole('heading', { level: 1 });

  await expect(heading).toHaveText('Page not found');
  await expect(page).toHaveTitle(/^Page not found \| /);
});

test('gives the guides introduction and the API introduction titles of their own', async({ page, baseURL }) => {
  await page.goto(`${baseURL}/javascript-data-grid/`);
  const guides = await page.title();

  await page.goto(`${baseURL}/javascript-data-grid/api/`);
  const api = await page.title();

  expect(guides).toBe('Documentation | Handsontable DataGrid for JavaScript');
  expect(api).toBe('API reference | Handsontable DataGrid for JavaScript');
});

test('lists only the versions in the changelog table of contents', async({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseURL}/javascript-data-grid/changelog/`);

  const toc = page.locator('starlight-toc nav');

  await expect(toc.getByRole('link').first()).toBeVisible();
  await expect(toc.getByRole('link', { name: 'Fixed', exact: true })).toHaveCount(0);
  await expect(toc.getByRole('link', { name: 'Added', exact: true })).toHaveCount(0);
  expect(await toc.getByRole('link', { name: /^\d+\.\d+\.\d+$/ }).count()).toBeGreaterThan(5);
});

for (const slug of ['accessibility', 'accessibility-conformance-report']) {
  test(`gives each framework variant of the ${slug} page its own title`, async({ page, baseURL }) => {
    const titles: string[] = [];

    for (const { prefix, name } of FRAMEWORKS) {
      await page.goto(`${baseURL}/${prefix}/${slug}/`);
      await expect(page).toHaveTitle(new RegExp(` \\| Handsontable DataGrid for ${name}$`));
      titles.push(await page.title());
    }

    expect(new Set(titles).size).toBe(FRAMEWORKS.length);
  });
}
