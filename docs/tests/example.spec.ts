import { test, expect } from '@playwright/test';

const guides = require('../content/sidebars').guides;

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

guides.forEach((guide) => {
  guide.children.filter(child => !child.path.includes('release-notes')).forEach((child) => {
    test(`take screenshot for JS on ${child.path.split('/').pop()}`, async({ page }) => {
      await page.goto(`http://localhost:8081/docs/javascript-data-grid/${child.path.split('/').pop()}`);
      await page.waitForLoadState('networkidle');
      const screenshotName = `js-${child.path.split('/').pop()}.png`;

      await expect(page).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: 0.01, fullPage: true });
    });
  });
});
const filteredGuides = require('../content/sidebars').guides.filter(item => !item.onlyFor);

filteredGuides.forEach((guide) => {
  guide.children.filter(child => !child.path.includes('release-notes')).forEach((child) => {
    test(`take screenshot for React on ${child.path.split('/').pop()}`, async({ page }) => {
      await page.goto(`http://localhost:8081/docs/react-data-grid/${child.path.split('/').pop()}`);
      await page.waitForLoadState('networkidle');
      const screenshotName = `react-${child.path.split('/').pop()}.png`;

      await expect(page).toHaveScreenshot(screenshotName, { maxDiffPixelRatio: 0.01, fullPage: true });
    });
  });
});
