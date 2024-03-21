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

jsPaths.forEach((jspath) => {
  test(`take screenshot for JS on ${jspath.path.split('/').pop()}`, async({ page, baseURL }) => {
    const path = `/javascript-data-grid/${jspath.path.split('/').pop()}`.replace('introduction', '');
    const maxDiffPixelRatioValue = pathsNeedingMoreTolerance.includes('path') ? 0.01 : 0.001;

    await page.goto(baseURL + path);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    const screenshotName = `js-${jspath.path.split('/').pop()}.png`;

    await expect(page).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: maxDiffPixelRatioValue, fullPage: true });
  });
});

reactPaths.forEach((reactPath) => {
  test(`take screenshot for React on ${reactPath.path.split('/').pop()}`, async({ page, baseURL }) => {
    const path = `/react-data-grid/${reactPath.path.split('/').pop()}`.replace('introduction', '');
    const maxDiffPixelRatioValue = pathsNeedingMoreTolerance.includes('path') ? 0.01 : 0.001;

    await page.goto(baseURL + path);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    const screenshotName = `react-${reactPath.path.split('/').pop()}.png`;

    await expect(page).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: maxDiffPixelRatioValue, fullPage: true });
  });
});
