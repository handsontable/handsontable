import { visualTest, test, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  openEditor,
  selectCell,
} from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that typing "to" into the editor of a City cell on the complex demo bolds the matching part of the
 * cities that contain it and highlights the best match. The column is a dropdown, so the list it opens is
 * not filtered. Owned by DEV-2981.
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

  const cell = await selectCell(4, 7);

  await openEditor(cell);

  const cellEditor = tablePage.locator(helpers.findCellEditor());

  await cellEditor.waitFor();
  await cellEditor.clear();
  await cellEditor.type('to');

  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
  await tablePage.waitForTimeout(300);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
