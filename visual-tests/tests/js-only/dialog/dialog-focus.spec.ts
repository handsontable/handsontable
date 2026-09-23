import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks where Tab and Shift+Tab move the focus in a dialog over a paginated grid: each capture shows the
 * focused control after one run of key presses. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dialog-demo')
      .setPageParams({ background: 'semi-transparent', contentbackground: 'true', pagination: 'true', focus: 'true' })
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await tablePage.keyboard.press('Shift+Tab');
  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
