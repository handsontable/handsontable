import { helpers } from '../../src/helpers';
import { test, expect } from '../../src/test-runner';

import {
  columnsCount,
  rowsCount,
  openHeaderDropdownMenu,
  selectCell,
  selectColumnHeaderByNameAndOpenMenu,
  setColumnSorting,
  SortDirection
} from '../../src/page-helpers';

test.describe('User wants to find a specific range of information in a table', () => {

  test('hide and show columns', async({ tablePage }) => {
    expect(await columnsCount()).toBe(9);

    await selectColumnHeaderByNameAndOpenMenu('Name');
    await tablePage.getByText('Hide column').click();
    expect(await columnsCount()).toBe(8);

    await selectColumnHeaderByNameAndOpenMenu('In stock');
    await tablePage.getByText('Hide column').click();
    expect(await columnsCount()).toBe(6);

    await tablePage.getByRole('columnheader', { name: 'Company name' }).click();
    await selectColumnHeaderByNameAndOpenMenu('Progress');

    await tablePage.getByText('Show columns').click();
    expect(await columnsCount()).toBe(9);
    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });

  test('filter', async({ tablePage }) => {
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
});
