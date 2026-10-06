import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks how the dialog's confirm template looks as it opens on its solid backdrop: the title, the
 * description, and the secondary and primary buttons. The template's slots, its Tab order, and Enter on
 * OK running the callback that hides it are asserted from the DOM in `tests/e2e/dialog-states.spec.ts`
 * on every theme and bundle, so the closed dialog this spec used to photograph second is gone. Added in
 * #11902; owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dialog-demo')
      .setPageParams({ template: 'confirm' })
      .getFullUrl()
  );

  const dialog = tablePage.locator('.ht-dialog');

  await expect(dialog).toHaveClass(/\bht-dialog--show\b/);
  await expect(dialog.locator('.ht-dialog__title')).toHaveText('Confirm');
  await expect(dialog.locator('.ht-dialog__description')).toHaveText('This is a confirm');
  await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeVisible();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
