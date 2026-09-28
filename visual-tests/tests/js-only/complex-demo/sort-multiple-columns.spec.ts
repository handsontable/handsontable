import { visualTest, test, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  setColumnSorting,
  setAdditionalColumnSorting,
  SortDirection,
} from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that a two-column sort (Age descending, then Interest ascending) renders both sort indicators and
 * their order numbers on the complex demo. Owned by DEV-2981.
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
  await setColumnSorting('Age', SortDirection.Descending);
  await setAdditionalColumnSorting('Interest', SortDirection.Ascending);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
