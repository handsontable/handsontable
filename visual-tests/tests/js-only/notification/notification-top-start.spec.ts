import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how a `info` notification toast looks: its accent, title, message, primary and secondary actions
 * and close button, shown in the top start corner of an LTR grid. Each corner's placement, 20 px in from
 * both edges in either direction, and the toast taking no focus, are asserted from DOM rects in
 * `tests/e2e/notification-placement.spec.ts` on every theme and bundle; what only pixels show is each
 * variant's look, so the four corners keep one capture each, one per variant. Added in #12299; owned by
 * DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/notification-demo')
      .setPageParams({ direction: 'ltr', position: 'top-start' })
      .getFullUrl()
  );

  const toast = tablePage.locator('.ht-notification__stack--top-start .ht-notification__toast');

  await expect(toast).toBeVisible();
  await expect(toast).toHaveClass(/\bht-notification__toast--info\b/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
