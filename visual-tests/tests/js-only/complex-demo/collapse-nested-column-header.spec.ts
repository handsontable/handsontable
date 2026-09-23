import { visualTest, test, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  collapseNestedColumn,
} from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that collapsing the nested-header group "I" on the complex demo renders the collapsed header and
 * hides the columns under it. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );
  await collapseNestedColumn('I');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
