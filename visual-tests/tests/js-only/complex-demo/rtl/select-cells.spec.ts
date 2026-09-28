import { visualTest, test, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  createSelection,
  selectCell,
} from '../../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that a range selection dragged across three rows and three columns renders its highlight on the
 * complex demo in RTL. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  const cellFrom = await selectCell(3, 0);
  const cellTo = await selectCell(5, 2);

  await createSelection(cellFrom, cellTo);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
