import { test, expect } from '@playwright/test';
import { layoutProblems, settledExamples } from './lib/example-grid-layout';

/**
 * Fails when a docs example does not lay out its grid: collapsed, too short to show a row, wider
 * than its own root, cut off by the example, or missing. What each fact means, and the regression
 * that made them necessary, is in `./lib/example-grid-layout.ts`.
 *
 * This spec checks five page shapes in all four frameworks. It runs on every docs pull request in
 * the `functional` project (report-only), and `.github/actions/docs-visual-run/action.yml` runs it
 * before every render that writes golden records, as the fast check: a deploy that is broken
 * everywhere fails here in seconds instead of after a full render. It is not the only guard. The
 * render itself checks every page it photographs, on the same load (`visualDocs.spec.ts`,
 * `DOCS_VISUAL_LAYOUT_GATE`), so an intermittent collapse this check did not happen to see, or a
 * page shape outside these five, still cannot become a golden.
 */

/**
 * One page per root-size shape the docs examples use, counted over every example grid on the
 * develop staging deploy on 2026-09-25 (976 grids on 445 pages).
 */
const PAGES = [
  // `height: 'auto'` and no width - 721 of the 976 grids.
  'row-height',
  // `height: 'auto'` with `width: '100%'`, seven grids.
  'column-width',
  // `height: 'auto'` with `width: 'auto'`.
  'batch-operations',
  // A fixed pixel height, on the demo page.
  'demo',
  // A fixed pixel width and height, and 100% of a sized parent.
  'grid-size',
];

const FRAMEWORKS = [
  { prefix: 'js', urlPath: 'javascript-data-grid' },
  { prefix: 'react', urlPath: 'react-data-grid' },
  { prefix: 'angular', urlPath: 'angular-data-grid' },
  { prefix: 'vue', urlPath: 'vue-data-grid' },
];

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

FRAMEWORKS.forEach(({ prefix, urlPath }) => {
  PAGES.forEach((slug) => {
    test(`${prefix} ${slug}: every example lays out its grid`, async({ page, baseURL }) => {
      const path = `/${urlPath}/${slug}`;

      await page.goto(`${baseURL}${path}`);
      await expect(page.getByText('We are verifying your connection')).toHaveCount(0, { timeout: 30000 });
      await expect(page.getByText('Page not found (404)')).toHaveCount(0);
      await expect(page.getByText('Password protected site')).toHaveCount(0);
      await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });

      expect(layoutProblems(await settledExamples(page)), `every example on ${path} lays out its grid`).toEqual([]);
    });
  });
});
