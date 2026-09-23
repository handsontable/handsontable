import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ page, goto, tablePage }) => {

  await page.setViewportSize({ width: 200, height: 400 });

  await goto(
    helpers
      .setBaseUrl('/wrapper-demo')
      .setPageParams({ preventOverflow: true })
      .getFullUrl()
  );

  await tablePage.mouse.move(50, 50);
  await tablePage.mouse.wheel(100, 0);
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(500);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
