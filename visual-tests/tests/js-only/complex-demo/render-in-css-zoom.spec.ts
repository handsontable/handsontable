import { visualTest, test, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that the complex demo renders its grid with headers, cells, and borders aligned when the page is
 * zoomed to 125% with CSS `zoom`. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );

  await tablePage.evaluate('document.body.style = "zoom: 1.25"');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
