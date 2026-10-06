import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how the loading overlay looks over the grid with its default spinner and title. Its content
 * (the default spinner and title, a custom icon, title and description), the focus Tab gives it, the
 * overlay covering a grid with no rows, and the RTL mirror are asserted from the DOM in
 * `tests/e2e/loading-states.spec.ts` on every theme and bundle; those states differ here only in their
 * text, so this is the family's one capture of the overlay. Added in #11792; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/loading-demo')
      .getFullUrl()
  );

  const overlay = tablePage.locator('.ht-dialog.ht-loading');

  await expect(overlay).toHaveClass(/\bht-dialog--show\b/);
  await expect(overlay.locator('svg.ht-loading__icon-svg')).toBeVisible();
  await expect(overlay.locator('.ht-loading__title')).toHaveText('Loading...');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
