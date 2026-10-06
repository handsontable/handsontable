import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks how a notification toast looks mirrored in an RTL grid with the Arabic language pack loaded (the
 * toast's own texts are the demo's English ones): the `warning` toast in the bottom start corner, which in
 * RTL is the grid's bottom right, with its accent bar on the right and its close button on the left. The
 * mirror (the layer's `dir`, the accent at the toast's inline start, the primary action first in reading
 * order, the close button at the inline end) and every corner's placement in both directions are asserted
 * from DOM rects in `tests/e2e/notification-placement.spec.ts` on every theme and bundle, so this is a
 * look check on `main` only; the LTR specs in `../` photograph each variant on `main` and `main-dark`, and
 * `../../dialog/dialog-template.spec.ts` photographs the toast's `.ht-button` actions on every js variant.
 * Added in #12299; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/notification-demo')
      .setPageParams({ direction: 'rtl', position: 'bottom-start' })
      .getFullUrl()
  );

  const toast = tablePage.locator('.ht-notification__stack--bottom-start .ht-notification__toast');

  await expect(toast).toBeVisible();
  await expect(toast).toHaveClass(/\bht-notification__toast--warning\b/);
  await expect(tablePage.locator('.ht-notification')).toHaveAttribute('dir', 'rtl');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
