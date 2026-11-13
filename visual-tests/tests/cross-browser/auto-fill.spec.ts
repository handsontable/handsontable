import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { selectCell, selectEditor, clearColumn } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

/**
 * Checks that double-clicking the fill handle of an edited cell fills its value down the column, and
 * renders the filled range with its selection, in Chromium, Firefox and WebKit, on the cell-types
 * demo. One capture in each browser, after asserting the column's last row holds the filled value and
 * lies in the selected range. The fill itself is asserted by `tests/e2e/fill-handle-double-click.spec.ts`
 * and the Jasmine autofill suites; what is engine-specific is the double click the browser synthesizes
 * on the handle, which one route proves. The merged-cells and nested-headers routes this spec also
 * photographed until DEV-3257 take the same handle path; on the merged-cells route the fill was
 * refused, because it would cut a merged area, and that refusal is asserted by
 * `tests/e2e/fill-handle-merged-cells.spec.ts`. Owned by DEV-3257.
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
  // Walkontable pairs two clicks on one cell's TD into a double click when the second comes within
  // 500 ms of the first one's release, and a click on the fill handle counts as a click on the cell it
  // belongs to. So no click lands on this cell before the handle's double click: the click goes to the
  // cell below it, and the keyboard does the rest, which arms no double-click window.
  const cellBelow = await selectCell(1, 2, table);

  await cellBelow.click();
  await expect(cellBelow).toHaveClass(/(^|\s)current(\s|$)/);
  await tablePage.keyboard.press('ArrowUp');
  await expect(cell).toHaveClass(/(^|\s)current(\s|$)/);
  await tablePage.keyboard.press('Enter');

  const cellEditor = await selectEditor();

  await cellEditor.fill('1100');
  await tablePage.keyboard.press('Enter');
  // The column is a currency column, so the committed value renders formatted.
  await expect(cell).toHaveText('$1,100.00');
  // Enter committed the value and moved the selection down a row; move it back.
  await tablePage.keyboard.press('ArrowUp');
  await expect(cell).toHaveClass(/(^|\s)current(\s|$)/);

  const cornerDiv = table.locator('div.wtBorder.current.corner').first();

  await cornerDiv.dblclick();
  // Filled down to the last of the demo's 20 rows, and the filled range selected.
  await expect(await selectCell(19, 2, table)).toHaveText('$1,100.00');
  await expect(await selectCell(19, 2, table)).toHaveClass(/(^|\s)area(\s|$)/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
