import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
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
  /**
   * Checks that an edited cell value is undone and then redone on this demo route. Three captures per route
   * in `urls`, in each browser: the edit, the undone value, and the redone one. Owned by DEV-2981.
   */
  visualTest(`Test undo and redo for: ${url}`, {
    themes: [CLASSIC],
    browsers: CROSS_BROWSERS,
    wrappers: [],
  }, async({ goto, tablePage }) => {
    await goto(url);

    const table = tablePage.locator('#root .ht-root-wrapper > .ht-grid > .ht-grid-content > .handsontable');

    await table.waitFor();
    const cell = await selectCell(2, 2, table);

    await openEditor(cell);

    const cellEditor = await selectEditor();

    await cellEditor.fill('test');
    await cellEditor.press('Enter');

    // eslint-disable-next-line no-restricted-syntax -- DEV-2981: capture after an unasserted press(); assert the state it shows (toBeFocused / toBeVisible / toHaveClass) when this family is consolidated
    await tablePage.screenshot({ path: helpers.screenshotPath() });
    await undo();
    await tablePage.screenshot({ path: helpers.screenshotPath() });
    await redo();
    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});
