import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import {
  openEditor,
  selectCell,
  selectEditor,
  undo,
  redo,
} from '../../src/page-helpers';

const urls = [
  '/cell-types-demo',
  '/arabic-rtl-demo',
  '/custom-style-demo',
  '/merged-cells-demo',
  '/nested-headers-demo',
  '/nested-rows-demo',
];

urls.forEach((url) => {
  test(`Test rows resizing for: ${url}`, async({ goto, tablePage }) => {
    await goto(url);

    const table = tablePage.locator('#root > .handsontable');

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await openEditor(cell);

    const cellEditor = await selectEditor();

    await cellEditor.fill('test');
    await cellEditor.press('Enter');

    await tablePage.screenshot({ path: helpers.screenshotPath() });
    await undo();
    await tablePage.screenshot({ path: helpers.screenshotPath() });
    await redo();
    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
