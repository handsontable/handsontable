import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';
import { selectCell, makeSelectionFromCell } from '../src/page-helpers';

test(__filename, async({ page }) => {
  const cell = await selectCell(1, 0);

  await makeSelectionFromCell(cell, 100);

  await page.screenshot({ path: helpers.screenshotPath() });
});
