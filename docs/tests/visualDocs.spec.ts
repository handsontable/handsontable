import { test, expect } from '@playwright/test';
import { jsPaths, reactPaths } from './paths';

const pathsNeedingMoreTolerance = [
  'events-and-hooks',
  'formula-calculation',
  'migration-from-7.4-to-8.0',
  'layout-direction',
  'selection',
  'events-and-hooks',
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
];

testCases.forEach(({ paths, prefix, urlPath }) => {
  test.describe(`${prefix} tests`, () => {
    paths.forEach((pathObj) => {
      test(`take screenshot for ${prefix} on ${pathObj.path.split('/').pop()}`, async({ page, baseURL }) => {
        const path = `/${urlPath}/${pathObj.path.split('/').pop()}`.replace('introduction', '');

        /**
         * The maximum difference in pixel ratio value.
         * If the 'path' is included in the 'pathsNeedingMoreTolerance' array, the value is set to 0.01.
         * This is because there are some randomly generated date in the grid which can cause the diff to be higher.
         * Otherwise, the value is set to 0.001 to carter for any small diffs due to anti-aliasing.
         */
        const maxDiffPixelRatioValue = pathsNeedingMoreTolerance.includes('path') ? 0.01 : 0.001;

        await page.goto(baseURL + path);
        await expect(page.getByText('Page not found (404)')).toHaveCount(0);
        await expect(page.getByText('Password protected site')).toHaveCount(0);
        await page.waitForLoadState('domcontentloaded');
        const screenshotName = `${prefix}-${pathObj.path.split('/').pop()}.png`;

        // eslint-disable-next-line max-len
        await expect(page).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: maxDiffPixelRatioValue, fullPage: true });
      });
    });
  });
});
