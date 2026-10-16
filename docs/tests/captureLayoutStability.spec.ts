import { test, expect, type Page } from '@playwright/test';
import { holdLayoutWidth } from './lib/hold-layout-width';

/**
 * A full-page capture must leave the example grids as they were. This pins what
 * `./lib/hold-layout-width.ts` exists for: on Linux CI the capture collapses the viewport to 1x1px,
 * and a grid that measures its columns in the collapsed page keeps wrapped column widths, so the
 * page the capture reports is taller than the page that was laid out (DEV-3458).
 *
 * `export-to-csv` is the page that showed it: three grids with a hidden-column layout, no column
 * widths, and a last column of multi-word text. The test fails on a Linux runner without the hold,
 * and passes anywhere with it. It cannot fail on a machine whose capture does not collapse the
 * viewport, so a green local run says nothing about the fix.
 */
const SLUG = 'export-to-csv';

const FRAMEWORKS = [
  { prefix: 'js', urlPath: 'javascript-data-grid' },
  { prefix: 'react', urlPath: 'react-data-grid' },
  { prefix: 'angular', urlPath: 'angular-data-grid' },
  { prefix: 'vue', urlPath: 'vue-data-grid' },
];

/**
 * Height of a PNG, read from its IHDR chunk.
 *
 * @param png The encoded image.
 * @returns The height in pixels.
 */
const pngHeight = (png: Buffer): number => png.readUInt32BE(20);

/**
 * The shape of every example grid on the page: its column widths, then the height of each body row.
 *
 * @param page The page under test.
 * @returns One string per grid.
 */
const gridShapes = (page: Page): Promise<string[]> => page.evaluate(() => {
  return [...document.querySelectorAll<HTMLTableElement>('.hot-example-preview .ht_master table.htCore')].map((table) => {
    const widths = [...table.querySelectorAll<HTMLElement>('colgroup col')].map(col => col.style.width);
    const heights = [...table.querySelectorAll<HTMLElement>('tbody tr')].map(row => row.offsetHeight);

    return `${widths.join(',')} / ${heights.join(',')}`;
  });
});

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
  test(`${prefix} ${SLUG}: a full-page capture leaves the example grids as they were`, async({ page, baseURL }) => {
    await page.goto(`${baseURL}/${urlPath}/${SLUG}`);
    await expect(page.getByText('We are verifying your connection')).toHaveCount(0, { timeout: 30000 });
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await expect(page.getByText('Password protected site')).toHaveCount(0);
    await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });

    await holdLayoutWidth(page);

    const shapesBefore = await gridShapes(page);
    const heightBefore = await page.evaluate(() => document.documentElement.scrollHeight);

    expect(shapesBefore.length, 'the page renders its example grids').toBeGreaterThan(0);

    // `toHaveScreenshot` keeps capturing until two shots agree, and the collapse comes with each one.
    for (let shot = 0; shot < 3; shot += 1) {
      const png = await page.screenshot({ fullPage: true, animations: 'disabled' });

      expect(pngHeight(png), `capture ${shot + 1} is as tall as the page that was laid out`).toBe(heightBefore);
    }

    await expect.poll(() => gridShapes(page), { timeout: 5000, message: 'the grids after the captures' })
      .toEqual(shapesBefore);
  });
});
