import { test, expect } from '@playwright/test';

const guides = require('../content/sidebars').guides;
const filteredGuides = require('../content/sidebars').guides.filter(item => !item.onlyFor);

test.beforeEach(async ({ page }) => {
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

// test.skip('take screenshot for JS on', async({ page }) => {

//   await page.goto('http://localhost:8081/docs/');

//   await page.waitForLoadState('networkidle');

//   const cookies = await page.context().cookies();

//   console.log(cookies);
//   await expect(page).toHaveScreenshot({ fullPage: true });
// });

guides.forEach((guide) => {
  guide.children.filter(child => !child.path.includes('release-notes')).forEach((child) => {
    test(`take screenshot for JS on ${child.path.split('/').pop()}`, async({ page }) => {
      await page.goto(`http://localhost:8081/docs/javascript-data-grid/${child.path.split('/').pop()}`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`js-${child.path.split('/').pop()}.png`, { fullPage: true });
    });
  });
});

filteredGuides.forEach((guide) => {
  guide.children.filter(child => !child.path.includes('release-notes')).forEach((child) => {
    test(`take screenshot for React on ${child.path.split('/').pop()}`, async({ page }) => {
      await page.goto(`http://localhost:8081/docs/react-data-grid/${child.path.split('/').pop()}`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`react-${child.path.split('/').pop()}.png`, { fullPage: true });
    });
  });
});
