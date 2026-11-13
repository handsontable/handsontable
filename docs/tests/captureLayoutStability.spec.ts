import { test, expect, type Page } from '@playwright/test';
import { settledExamples } from './lib/example-grid-layout';

/**
 * A full-page capture must leave the example grids as they were.
 *
 * On Linux CI `page.screenshot({ fullPage: true })` shrinks the viewport to 1x1px for a moment, and the
 * docs layout follows it: every example collapses to a 0px grid root. Until DEV-3460 a grid measured
 * its columns in that root and kept the wrapped widths when the viewport came back, so the page the
 * capture reported was taller than the page that was laid out, and the golden of `export-to-csv`
 * flipped between two heights (DEV-3458). `export-to-csv` is that page: three grids with hidden
 * columns, no column widths, and a last column of multi-word text.
 *
 * Two tests per framework. The first forces the collapse with `setViewportSize()`, so it fails on any
 * machine when a grid keeps wrapped widths. The second takes the full-page captures the visual suite
 * takes, which collapse the viewport only on Linux, and only in some renders. No retries: a render that
 * keeps wrapped widths once is the failure, and a retry would report it as flaky and pass.
 */
const SLUG = 'export-to-csv';

const FRAMEWORKS = [
  { prefix: 'js', urlPath: 'javascript-data-grid' },
  { prefix: 'react', urlPath: 'react-data-grid' },
  { prefix: 'angular', urlPath: 'angular-data-grid' },
  { prefix: 'vue', urlPath: 'vue-data-grid' },
];

test.describe.configure({ retries: 0 });

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

/**
 * Loads the page and returns its settled grids and height, the baseline both tests compare against.
 *
 * @param page The page under test.
 * @param url The page's URL.
 * @returns The grid shapes and the document height.
 */
async function loadSettled(page: Page, url: string): Promise<{ shapes: string[], height: number }> {
  await page.goto(url);
  await expect(page.getByText('We are verifying your connection')).toHaveCount(0, { timeout: 30000 });
  await expect(page.getByText('Page not found (404)')).toHaveCount(0);
  await expect(page.getByText('Password protected site')).toHaveCount(0);
  await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });
  // The runner clears the overlay of a React example before React commits it, so wait for the grids.
  await settledExamples(page);

  const shapes = await gridShapes(page);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);

  expect(shapes.length, 'the page renders its example grids').toBeGreaterThan(0);

  return { shapes, height };
}

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
  test(`${prefix} ${SLUG}: a viewport that collapses to 1x1 and comes back leaves the grids as they were`, async({ page, baseURL }) => {
    const before = await loadSettled(page, `${baseURL}/${urlPath}/${SLUG}`);
    const viewport = page.viewportSize()!;

    await page.setViewportSize({ width: 1, height: 1 });
    // The collapse the capture causes on Linux: without it this test proves nothing.
    await expect.poll(
      () => page.evaluate(() => document.querySelector('.hot-example-preview .ht_master')!.parentElement!.clientWidth),
      { message: 'the grid root collapses with the viewport' },
    ).toBe(0);
    // Let each grid draw once in the collapsed root, which is when it used to measure wrapped widths.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.setViewportSize(viewport);
    await settledExamples(page);

    expect(await gridShapes(page), 'the grids after the collapse').toEqual(before.shapes);
    expect(await page.evaluate(() => document.documentElement.scrollHeight), 'the page height after the collapse')
      .toBe(before.height);
  });

  test(`${prefix} ${SLUG}: a full-page capture leaves the grids as they were`, async({ page, baseURL }) => {
    const before = await loadSettled(page, `${baseURL}/${urlPath}/${SLUG}`);

    // `toHaveScreenshot` keeps capturing until two shots agree, and the collapse comes with each one.
    for (let shot = 0; shot < 3; shot += 1) {
      const png = await page.screenshot({ fullPage: true, animations: 'disabled' });

      expect(pngHeight(png), `capture ${shot + 1} is as tall as the page that was laid out`).toBe(before.height);
    }

    await expect.poll(() => gridShapes(page), { timeout: 5000, message: 'the grids after the captures' })
      .toEqual(before.shapes);
  });
});
