import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks how the loading overlay looks mirrored over an RTL grid, in Arabic: the spinner on the right of
 * the title. That the overlay covers the grid's root and puts the spinner at the title's inline start in
 * RTL is asserted from DOM rects in `tests/e2e/loading-states.spec.ts` on every theme and bundle, so this
 * is a look check on `main` only; `../loading-default.spec.ts` photographs the overlay on `main` and
 * `main-dark`. Added in #11792; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/loading-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  const overlay = tablePage.locator('.ht-dialog.ht-loading');

  await expect(overlay).toHaveClass(/\bht-dialog--show\b/);
  await expect(overlay).toHaveAttribute('dir', 'rtl');
  await expect(overlay.locator('.ht-loading__title')).toHaveText('جاري التحميل...');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
