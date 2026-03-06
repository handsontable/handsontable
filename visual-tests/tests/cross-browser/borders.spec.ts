import { helpers } from '../../src/helpers';
import { test } from '../../src/test-runner';
import {
  selectCell,
  CellBorder,
  setCellBorders,
} from '../../src/page-helpers';

test('Test borders', async({ tablePage }) => {
  const cell = await selectCell(5, 1);

  await setCellBorders(cell, CellBorder.Bottom);
  await (await selectCell(0, 0)).click(); // to move focus and show cell borders

  await tablePage.screenshot({
    path: helpers.screenshotPath(),
  });
});
