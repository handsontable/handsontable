import { visualTest, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how a dialog with a semi-transparent backdrop and a filled content box composites over the grid:
 * the rows behind showing through the backdrop, and the content box on top of them. The backdrop's
 * translucency and the content box's fill, the dialog lying exactly over the grid's root, the solid
 * backdrop, the focus moves around a dialog that holds inputs, and the RTL layout are asserted from the
 * DOM in `tests/e2e/dialog-states.spec.ts` on every theme and bundle; what only pixels show is the
 * compositing, so this capture stays. It renders on every js variant because `horizon` defines the
 * content box's two tokens its own way (`--ht-dialog-content-border-radius` and
 * `--ht-dialog-content-background-color`) and no other every-variant capture opens a dialog; the bare run
 * comes with the declaration. Added in #11754; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dialog-demo')
      .setPageParams({ background: 'semi-transparent', contentbackground: 'true' })
      .getFullUrl()
  );

  const dialog = tablePage.locator('.ht-dialog');

  await expect(dialog).toHaveClass(/\bht-dialog--show\b/);
  await expect(dialog).toHaveClass(/\bht-dialog--background-semi-transparent\b/);
  await expect(dialog.locator('.ht-dialog__content')).toHaveClass(/\bht-dialog__content--background\b/);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
