import { test, expect } from '@playwright/test';
import { jsPaths, reactPaths, angularPaths, vuePaths } from './paths';

const pathsNeedingMoreTolerance = [
  'events-and-hooks',
  'formula-calculation',
  'migration-from-7.4-to-8.0',
  'layout-direction',
  'selection',
  // Date-picker and sorting highlight animations make these less stable.
  'column-filter',
  'rows-sorting',
  // Pages with computed/aggregated values or framework-heavy bootstrap that
  // can produce minor pixel differences between collection and comparison runs.
  'column-summary',
  'binding-to-data',
  'configuration-options',
  'server-side-data',
  'cell-renderer',
  'theme-customization',
  'rows-pagination',
  'dialog',
];

// These pages have 40+ Handsontable grids, each running a requestAnimationFrame
// settle loop. Playwright's fullPage screenshot resizes the viewport, which
// triggers grid recalculation and causes an unstable layout loop that consistently
// times out the screenshot stability check. Marked as fixme (won't run, won't fail
// the job) until a reliable fix is found.
const slugsToFix = ['column-filter', 'rows-sorting'];

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
    },
    {
      name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
      value: process.env.PASS_COOKIE ? process.env.PASS_COOKIE : '',
      domain: 'dev.handsontable.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
});

const testCases = [
  { paths: jsPaths, prefix: 'js', urlPath: 'javascript-data-grid' },
  { paths: reactPaths, prefix: 'react', urlPath: 'react-data-grid' },
  { paths: angularPaths, prefix: 'angular', urlPath: 'angular-data-grid' },
  { paths: vuePaths, prefix: 'vue', urlPath: 'vue-data-grid' },
];

testCases.forEach(({ paths, prefix, urlPath }) => {
  test.describe(`${prefix} tests`, () => {
    paths.forEach((pathObj) => {
      test(`take screenshot for ${prefix} on ${pathObj.path.split('/').pop()}`, async({ page, baseURL }) => {
        const slug = pathObj.path.split('/').pop() ?? '';

        /*
         * Sanitized the way Playwright sanitizes it, because Playwright writes the file and this
         * name has to match what it wrote. `snapshotPath()` runs the argument through
         * `sanitizeForFilePath` before substituting `{arg}`, turning every character outside
         * `[\w-]` into `-`, so `migration-from-7.4-to-8.0` lands on disk as
         * `migration-from-7-4-to-8-0.png`. Leaving the dots in makes the annotation below name a
         * file that does not exist: the manifest adapter diffs those strings against the baseline
         * keys, so all 35 dotted pages read as deleted goldens plus new renders, and the verdict is
         * `changed` on every run with nothing to fix. Verified against @playwright/test 1.61.1 —
         * 1.45 did not sanitize here, so this is version-sensitive rather than eternal.
         */
        const screenshotName = `${prefix}-${slug.replace(/[^\w-]+/g, '-')}.png`;

        /*
         * Which golden record this test owns, for `tests/lib/visual-manifest.mjs`: Playwright's report
         * carries the test's title, not the file it compared, so the manifest the visual gate reads is
         * built from these annotations. FIRST statement of the body on purpose — `test.fixme()` below
         * throws where it stands, and a parked page that declared nothing would be read as a golden
         * nobody owns any more and dropped from the baseline by the next seed.
         */
        test.info().annotations.push({ type: 'snapshot', description: `visualDocs.spec.ts/${screenshotName}` });

        const path = `/${urlPath}/${pathObj.path.split('/').pop()}`.replace('introduction', '');

        /**
         * The maximum difference in pixel ratio value.
         * Pages with dynamic/random data use 0.05 to avoid false positives from changing values.
         * All other pages use 0.01 to allow for minor anti-aliasing differences between runs.
         */
        const maxDiffPixelRatioValue = pathsNeedingMoreTolerance.includes(slug) ? 0.05 : 0.01;

        if (slugsToFix.includes(slug)) {
          test.fixme();
        }

        await page.goto(baseURL + path);
        await expect(page.getByText('We are verifying your connection')).toHaveCount(0, { timeout: 30000 });
        await expect(page.getByText('Page not found (404)')).toHaveCount(0);
        await expect(page.getByText('Password protected site')).toHaveCount(0);
        await page.waitForLoadState('domcontentloaded');

        // Wait for all example loading overlays to disappear before screenshotting.
        // Angular and Vue examples can take several seconds to bootstrap; without
        // this wait the screenshot captures a loading shimmer instead of the grid.
        await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });

        // Third-party Figma embeds (e.g. the design-system "Live preview") load
        // asynchronously and are sometimes blank when the screenshot is taken.
        // Mask them so their load state can't make the comparison flaky. The
        // locator is a no-op on pages without a Figma iframe.
        const figmaEmbeds = page.locator('iframe[src*="figma.com"]');

        // eslint-disable-next-line max-len
        await expect(page).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: maxDiffPixelRatioValue, fullPage: true, animations: 'disabled', mask: [figmaEmbeds] });
      });
    });
  });
});
