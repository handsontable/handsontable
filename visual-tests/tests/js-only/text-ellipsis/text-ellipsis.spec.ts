import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks that cell text too long for its column is cut off with an ellipsis. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/text-ellipsis-demo')
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
