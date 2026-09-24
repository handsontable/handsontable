import { visualTest, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks that the dialog renders over the grid with its default options in RTL. Added in #11754; owned by
 * DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dialog-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
