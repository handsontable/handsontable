import { visualTest, test, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks the complex demo's paint at 125% CSS `zoom` on `main`: a sub-pixel smoke of how the zoomed
 * borders and text rasterize, which only pixels show. That the overlays line up with the master under
 * that zoom — every header, frozen row, frozen column and corner cell on its master cell's edges — is
 * asserted from DOM rects in `tests/e2e/overlay-alignment-css-zoom.spec.ts` on every theme, and the
 * complex demo itself is photographed on every js variant by `js-only/complex-demo/manual-row-resize`
 * (the same LTR demo, with the resize guide pressed). Owned by DEV-3205.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );

  await tablePage.evaluate('document.body.style = "zoom: 1.25"');
  // The zoom is the state this capture is of, so it is asserted rather than assumed.
  await expect(tablePage.locator('body')).toHaveCSS('zoom', '1.25');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
