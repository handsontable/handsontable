import { visualTest, test, expect } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  openEditor,
  selectCell,
} from '../../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks how the select editor looks open over an Interest cell on the complex demo in RTL: the native
 * `<select>` styled with the theme's editor tokens, its arrow at the inline end, placed and sized to the
 * cell. Opening the editor does not open the option list, so the select is shown closed. That the editor
 * covers the cell, holds the cell's value and options and is laid out right to left is asserted in
 * `tests/e2e/complex-demo-states.spec.ts` on every theme and bundle; it is the suite's one capture of
 * the select editor, so it stays on the two-theme default. Owned by DEV-3285.
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

  const cell = await selectCell(5, 4);

  await openEditor(cell);

  const select = tablePage.locator('.htSelectEditor select');

  await expect(select).toBeVisible();
  await expect(select).toBeFocused();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
