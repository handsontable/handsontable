import { helpers } from '../../src/helpers';
import { test } from '../../src/test-runner';
import {
  selectCell,
  createSelection,
  CellBorder,
  setCellBorders
} from '../../src/page-helpers';

test(__filename, async({ tablePage }) => {
  const cellFrom = await selectCell(1, 1);
  const cellTo = await selectCell(5, 1);

  await createSelection(cellFrom, cellTo);

  await cellTo.click({ button: 'right' });
  await tablePage.getByText('Merge cells').click();
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await setCellBorders(cellFrom, CellBorder.Bottom);

  await (await selectCell(0, 0)).click(); // to move focus and show cell borders

  await tablePage.screenshot({ path: helpers.screenshotPath() });

});
