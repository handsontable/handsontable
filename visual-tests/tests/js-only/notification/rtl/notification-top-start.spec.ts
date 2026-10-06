import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks how a notification toast looks mirrored in an RTL grid, in Arabic: the `info` toast in the top
 * start corner, which in RTL is the grid's top right, with its close button on the left. Every corner's
 * placement in both directions, the layer's `dir` and the close button at the toast's inline end are
 * asserted from DOM rects in `tests/e2e/notification-placement.spec.ts` on every theme and bundle, so
 * this is a look check on `main` only; the LTR specs in `../` photograph each variant on `main` and
 * `main-dark`. Added in #12299; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/notification-demo')
      .setPageParams({ direction: 'rtl', position: 'top-start' })
      .getFullUrl()
  );

  const toast = tablePage.locator('.ht-notification__stack--top-start .ht-notification__toast');

  await expect(toast).toBeVisible();
  await expect(tablePage.locator('.ht-notification')).toHaveAttribute('dir', 'rtl');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
