import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

test(__filename, async({ tablePage }) => {
  const cell = await selectCell(0, 0);

  // move the focus to the corner
  await cell.click();
  await tablePage.locator('html').press('ArrowLeft');
  await tablePage.locator('html').press('ArrowUp');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
