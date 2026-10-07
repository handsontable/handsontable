import { visualTest, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks how a dialog with its default options looks over an RTL grid: the content's text aligned to the
 * right, its inline start. That the dialog lies over the grid's root and lays its content out right to
 * left is asserted from DOM rects in `tests/e2e/dialog-states.spec.ts` on every theme and bundle, so
 * this is a look check on `main` only. Its LTR twins render on every js variant:
 * `../dialog-template.spec.ts` photographs the dialog on the same solid backdrop, and
 * `../dialog-background-semi-transparent.spec.ts` the same default content, in a filled box. Added in
 * #11754; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dialog-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  const dialog = tablePage.locator('.ht-dialog');

  await expect(dialog).toHaveClass(/\bht-dialog--show\b/);
  await expect(dialog).toHaveAttribute('dir', 'rtl');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
