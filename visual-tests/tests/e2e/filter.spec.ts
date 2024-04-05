import { helpers } from '../../src/helpers';
import { test, expect } from '../../src/test-runner';

import {
  rowsCount,
  openHeaderDropdownMenu,
  selectCell,
  setColumnSorting,
  SortDirection,
} from '../../src/page-helpers';

test(__filename, async({
  tablePage,
}) => {
  expect(await rowsCount()).toBe(22);
  await openHeaderDropdownMenu(9);
  await tablePage.getByText('Clear', { exact: true }).click();
  await tablePage.getByPlaceholder('Search').type('India', { delay: 100 });
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.getByLabel('Filter by value:').getByText('India').click();
  await tablePage.getByRole('button', { name: 'OK' }).click();
  expect(await rowsCount()).toBe(6);
  await setColumnSorting('Qty', SortDirection.Descending);
  const cell = await selectCell(0, 4);

  expect(await cell.innerText()).toBe('162');
});
