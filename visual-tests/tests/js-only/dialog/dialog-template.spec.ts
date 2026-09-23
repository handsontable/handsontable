import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks the dialog's confirm template: the first capture shows it as it opens, the second after the focus
 * has cycled through its controls back to "OK" and Enter was pressed. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/dialog-demo')
      .setPageParams({ template: 'confirm' })
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // move focus throughout the component and back to the "OK" button
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Shift+Tab');

  // check if the Enter (event) is triggered
  await tablePage.keyboard.press('Enter');

  // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted keyboard.press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
