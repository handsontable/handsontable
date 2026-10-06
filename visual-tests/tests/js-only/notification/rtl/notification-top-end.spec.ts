import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks where and how the `success` toast in the top end corner of an RTL grid is drawn, with the Arabic
 * language pack loaded. The corner's place against the grid is parked in
 * `tests/e2e/notification-placement.spec.ts` (the notification layer spans the root wrapper, so an
 * end-corner toast lands at the container's far edge, on the left of the page in RTL, instead of in the
 * grid's corner); that spec still asserts the toast's variant, accent bar, actions, close button and its
 * place in the layer's corner live. Until the placement is fixed this capture is the RTL end corners' one
 * check of where the toast is drawn, so it stays as a look check on `main`, and it will change when the
 * fix lands. Added in #12299; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/notification-demo')
      .setPageParams({ direction: 'rtl', position: 'top-end' })
      .getFullUrl()
  );

  const toast = tablePage.locator('.ht-notification__stack--top-end .ht-notification__toast');

  await expect(toast).toBeVisible();
  await expect(toast).toHaveClass(/\bht-notification__toast--success\b/);
  await expect(tablePage.locator('.ht-notification')).toHaveAttribute('dir', 'rtl');
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
