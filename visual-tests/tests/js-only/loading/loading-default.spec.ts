import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how the loading overlay looks over the grid with its default spinner and title, on the
 * semi-transparent backdrop. The other states are asserted from the DOM in
 * `tests/e2e/loading-states.spec.ts` on every theme and bundle, each against the token that paints it: the
 * custom description's secondary color and small type, the accent border the focused overlay draws, the
 * solid backdrop over a grid with no rows, the spinner one content gap from the title, and the RTL
 * mirror. What only pixels show is the overlay's compositing, so this is the family's one capture of it;
 * the dialog's every-variant captures (`../dialog/`) cover the backdrop and border it shares with them.
 * Added in #11792; owned by DEV-3285.
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
