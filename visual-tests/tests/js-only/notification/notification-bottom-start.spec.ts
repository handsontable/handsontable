import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how a `warning` notification toast looks: its accent bar, title, message, primary and
 * secondary actions and close button, shown in the bottom start corner of an LTR grid. Each corner's
 * toast (its variant, its accent bar, its actions in order, its close button at the inline end, the
 * toast taking no focus) and its place 20 px in from both edges of its corner are asserted from DOM
 * rects in `tests/e2e/notification-placement.spec.ts` in both directions, on every theme and bundle;
 * what only pixels show is each variant's look, so the four corners keep one capture each, one per
 * variant. Added in #12299; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/notification-demo')
      .setPageParams({ direction: 'ltr', position: 'bottom-start' })
      .getFullUrl()
  );

  const toast = tablePage.locator('.ht-notification__stack--bottom-start .ht-notification__toast');

  await expect(toast).toBeVisible();
  await expect(toast).toHaveClass(/\bht-notification__toast--warning\b/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
