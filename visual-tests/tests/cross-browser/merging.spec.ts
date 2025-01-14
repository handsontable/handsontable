import { helpers } from '../../src/helpers';
import { test } from '../../src/test-runner';
import {
  selectCell,
  createSelection,
  selectFromContextMenu,
} from '../../src/page-helpers';

test.skip('Test merging', async({ goto, tablePage }) => {
  await goto('/merged-cells-demo');

  const cellFrom = await selectCell(15, 1);
  const cellTo = await selectCell(20, 2);

  await createSelection(cellFrom, cellTo);

  await cellFrom.click({ button: 'right' });
  await selectFromContextMenu('"Merge cells"');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
