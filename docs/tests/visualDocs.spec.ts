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

test.beforeEach(async({ page }) => {

  await page.context().addCookies([
    {
      name: 'CookieConsent',
      value: '-2',
      domain: 'localhost',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    },
  ]);
});

jsPaths.forEach((jspath) => {
  test(`take screenshot for JS on ${jspath.path.split('/').pop()}`, async({ page }) => {
    const path = `/javascript-data-grid/${jspath.path.split('/').pop()}`.replace('introduction', '');
    const maxDiffPixelRatioValue = pathsNeedingMoreTolerance.includes('path') ? 0.01 : 0.001;

    await page.goto(path);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    const screenshotName = `js-${jspath.path.split('/').pop()}.png`;

    await expect(page).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: maxDiffPixelRatioValue, fullPage: true });
  });
});

// console.log(reactGuides);
reactPaths.forEach((reactPath) => {
  test(`take screenshot for React on ${reactPath.path.split('/').pop()}`, async({ page }) => {
    const path = `/react-data-grid/${reactPath.path.split('/').pop()}`.replace('introduction', '');
    const maxDiffPixelRatioValue = pathsNeedingMoreTolerance.includes('path') ? 0.01 : 0.001;

    await page.goto(path);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    const screenshotName = `react-${reactPath.path.split('/').pop()}.png`;

    await expect(page).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: maxDiffPixelRatioValue, fullPage: true });
  });
});
