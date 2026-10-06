import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how a `error` notification toast looks: its accent, title, message, primary and secondary actions
 * and close button, shown in the bottom end corner of an LTR grid. Each corner's placement, 20 px in from
 * both edges in either direction, and the toast taking no focus, are asserted from DOM rects in
 * `tests/e2e/notification-placement.spec.ts` on every theme and bundle; what only pixels show is each
 * variant's look, so the four corners keep one capture each, one per variant. In this demo the toast lands
 * at the far end of the page rather than of the 400 px grid; the end-corner placement test in that spec is
 * parked until the layer is sized to the grid, and this capture will change when it is. Added in #12299;
 * owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/notification-demo')
      .setPageParams({ direction: 'ltr', position: 'bottom-end' })
      .getFullUrl()
  );

  const toast = tablePage.locator('.ht-notification__stack--bottom-end .ht-notification__toast');

  await expect(toast).toBeVisible();
  await expect(toast).toHaveClass(/\bht-notification__toast--error\b/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
