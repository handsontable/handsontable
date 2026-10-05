import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { openEditor, selectCell, selectEditor, clearColumn } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

/**
 * Checks that double-clicking the fill handle of an edited cell fills its value down the column, and
 * renders the filled range with its selection, in Chromium, Firefox and WebKit, on the cell-types
 * demo. One capture in each browser, after asserting the column's last row holds the filled value and
 * lies in the selected range. The fill itself is asserted by `tests/e2e/fill-handle-double-click.spec.ts` and the
 * Jasmine autofill suites; what is engine-specific is the double click the browser synthesizes on the
 * handle, which one route proves. The merged-cells and nested-headers routes this spec also
 * photographed until DEV-3257 take the same handle path. Owned by DEV-3257.
 */
visualTest('Test autofill for: /cell-types-demo', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/cell-types-demo');

  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();
  await clearColumn(3);

  const cell = await selectCell(0, 2, table);

  await openEditor(cell);

  const cellEditor = await selectEditor();

  await cellEditor.fill('1100');
  await tablePage.keyboard.press('Enter');
  // The column is a currency column, so the committed value renders formatted.
  await expect(cell).toHaveText('$1,100.00');
  // The click below goes to the cell the editor was opened on, and Walkontable reads a second click on
  // a cell within 500 ms of the first one's release as a double click, which would open the editor again.
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: Walkontable's 500 ms double-click window between two clicks on one cell; no state marks it closed
  await tablePage.waitForTimeout(500);

  await cell.click();
  await expect(cell).toHaveClass(/(^|\s)current(\s|$)/);
  // The fill handle's double click below would land inside the window this click's release opens.
  // Measured without this wait: the column still fills, but the filled range is not selected, so the
  // capture shows a different selection.
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: the same 500 ms double-click window, between the click on the cell and the fill handle's double click
  await tablePage.waitForTimeout(500);

  const cornerDiv = table.locator('div.wtBorder.current.corner').first();

  await cornerDiv.dblclick();
  // Filled down to the last row, and the filled range selected.
  await expect(await selectCell(11, 2, table)).toHaveText('$1,100.00');
  await expect(await selectCell(11, 2, table)).toHaveClass(/(^|\s)area(\s|$)/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
