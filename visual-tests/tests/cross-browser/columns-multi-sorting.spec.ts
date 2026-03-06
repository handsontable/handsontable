import { helpers } from '../../src/helpers';
import { test, expect } from '../../src/test-runner';
import {
  selectCell,
  setColumnSorting,
  setAdditionalColumnSorting,
  SortDirection,
} from '../../src/page-helpers';

test('Test column multi-sorting', async({ tablePage }) => {
  await setColumnSorting('Country', SortDirection.Descending);
  await setAdditionalColumnSorting('Qty', SortDirection.Ascending);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  const cell = await selectCell(3, 4); // first Qty for United States

  expect(await cell.innerText()).toBe('15');
});
