import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks that a dialog renders over a paginated grid, and where two Tab presses move the focus. Owned by
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
      .setPageParams({ background: 'semi-transparent', contentbackground: 'true', pagination: 'true' })
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
