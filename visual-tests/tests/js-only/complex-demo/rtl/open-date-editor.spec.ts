import { visualTest, test, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import { selectCell } from '../../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that the date editor opens on the complex demo in RTL, by a double-click, with the browser's
 * native date picker showing (a keyboard open leaves the picker closed): the suite's one capture of that
 * picker, so it is also what proves the theme's color scheme reaches the native control. That is a
 * light-and-dark question, which `main` and `main-dark` answer; `horizon` and `horizon-dark` set the same
 * two schemes and the bare run is `main`'s stylesheet, so the capture is on the two-theme default. `showPicker()` sits in a silent `try`/`catch` in `editors/utils/showNativePicker.ts`, which also skips it for a keyboard open,
 * so the capture waits on the input's `:open` state, which is true only while the picker is shown. Where
 * the picker opens is the browser's, not the grid's; the editor's input over the cell is asserted in
 * `handsontable/src/editors/dateEditor/__tests__/positioning.spec.js`. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
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

  await cell.dblclick();
  // `:open` matches the date input only while its native picker is shown (Chromium 133+).
  await expect(tablePage.locator('.handsontableInput:open')).toBeVisible();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
