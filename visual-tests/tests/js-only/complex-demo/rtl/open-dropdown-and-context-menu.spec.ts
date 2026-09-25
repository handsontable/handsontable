import { visualTest, test, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  openHeaderDropdownMenu,
  openContextMenu,
  selectCell,
} from '../../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that the column dropdown menu and the cell context menu open and render on the complex demo in
 * RTL, one capture each. Owned by DEV-2981.
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
  await openHeaderDropdownMenu('Age');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  const cell = await selectCell(5, 1);

  await openContextMenu(cell);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
