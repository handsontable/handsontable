import { visualTest, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks that the loading overlay renders with its default icon and text in RTL. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/loading-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
