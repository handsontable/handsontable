import { helpers } from '../../src/helpers';
import { test } from '../../src/test-runner';
import {
  selectCell,
  createSelection,
  selectFromContextMenu,
} from '../../src/page-helpers';

// eslint-disable-next-line no-restricted-syntax -- DEV-2797: parked since b558a787a (2025-01-14) with no owner; the consolidation phase decides whether the merge-cells geometry capture is repaired or removed
test.skip('Test merging', async({ goto, tablePage }) => {
  await goto('/merged-cells-demo');

  const cellFrom = await selectCell(15, 1);
  const cellTo = await selectCell(20, 2);

  await createSelection(cellFrom, cellTo);

  await cellFrom.click({ button: 'right' });
  await selectFromContextMenu('Merge cells');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
