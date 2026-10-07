import { visualTest, test, expect, JS_VARIANTS } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  openEditor,
  selectCell,
} from '../../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that the date editor opens on the complex demo in RTL with the browser's native date picker
 * showing, on every js variant: the suite's one capture of that picker, so it is also what proves the
 * theme's color scheme reaches the native control. `showPicker()` sits in a silent `try`/`catch` in
 * `dateEditor.ts`, so the capture waits on the input's `:open` state, which is true only while the
 * picker is shown. Where the picker opens is the browser's, not the grid's; the editor's input over the
 * cell is asserted in `handsontable/src/editors/dateEditor/__tests__/positioning.spec.js`. Owned by
 * DEV-3139.
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

  const cell = await selectCell(4, 8);

  await openEditor(cell);
  // `:open` matches the date input only while its native picker is shown (Chromium 133+).
  await expect(tablePage.locator('.handsontableInput:open')).toBeVisible();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
