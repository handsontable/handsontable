import { test } from '../../src/test-runner';
import { openEditor, selectCell, selectEditor, clearColumn } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

const urls = [
  '/cell-types-demo',
  '/merged-cells-demo',
  '/nested-headers-demo',
];

urls.forEach((url) => {
  test(`Test autofill for: ${url}`, async({ goto, tablePage }) => {
    await goto(url);

    const table = tablePage.locator(helpers.selectors.mainTable);

    await table.waitFor();
    await clearColumn(3);

    let cell = await selectCell(0, 2, table);

    await openEditor(cell);

    const cellEditor = await selectEditor();

    await cellEditor.fill('1100');
    await tablePage.keyboard.press('Enter');
    await tablePage.waitForTimeout(500);

    cell = await selectCell(0, 2, table);

    await cell.click();
    await tablePage.waitForTimeout(500);

    const cornerDiv = table.locator('div.wtBorder.current.corner').first();

    await cornerDiv.dblclick();
    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
