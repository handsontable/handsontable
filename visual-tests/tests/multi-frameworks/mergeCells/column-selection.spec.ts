import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  selectCell,
  createSelection,
  clickWithPosition,
  clickWithPositionAndModifiers,
  selectClonedCell,
} from '../../../src/page-helpers';

/**
 * Checks whether the selection highlights the merged cells correctly.
 */
test(__filename, async({ tablePage }) => {
  const cellFrom = await selectCell(3, 0);
  const cellTo = await selectCell(5, 2);

  await createSelection(cellFrom, cellTo);

  await tablePage.keyboard.press('Control+m'); // triggers cell merging

  // take a screenshot of the merged cell
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await clickWithPositionAndModifiers(await selectClonedCell(0, 1));
  await clickWithPositionAndModifiers(await selectClonedCell(0, 2));
  await clickWithPositionAndModifiers(await selectClonedCell(0, 3));

  // take a screenshot of the selected merged cell (the selection covers the whole merged cell)
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await clickWithPosition(await selectClonedCell(0, 2));

  // the merged cell should be unselected (the selection does not cover the whole merged cell)
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
