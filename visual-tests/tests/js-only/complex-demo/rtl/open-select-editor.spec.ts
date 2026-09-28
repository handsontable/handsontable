import { visualTest, test, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  openEditor,
  selectCell,
} from '../../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that the select editor opens over an Interest cell on the complex demo in RTL: the native
 * `<select>` and its arrow, placed and sized to the cell. Opening the editor does not open the option list,
 * so the capture shows the select closed. Owned by DEV-2981.
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

  const cell = await selectCell(5, 4);

  await openEditor(cell);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
