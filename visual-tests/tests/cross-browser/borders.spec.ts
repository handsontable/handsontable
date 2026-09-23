import { helpers } from '../../src/helpers';
import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectCell,
  CellBorder,
  setCellBorders,
} from '../../src/page-helpers';

visualTest('Test borders', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  const cell = await selectCell(5, 1);

  await setCellBorders(cell, CellBorder.Bottom);
  await (await selectCell(0, 0)).click(); // to move focus and show cell borders

  await tablePage.screenshot({
    path: helpers.screenshotPath(),
  });
});
