import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks that the loading overlay renders over a grid with no data. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/loading-demo')
      .setPageParams({ nodata: 'true' })
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
