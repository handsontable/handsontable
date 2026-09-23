import { visualTest, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';

/**
 * Checks that a notification toast renders in the bottom-end corner of the grid, in RTL. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/notification-demo')
      .setPageParams({ direction: 'rtl', position: 'bottom-end' })
      .getFullUrl()
  );

  await tablePage.locator('.ht-notification__toast').waitFor();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
