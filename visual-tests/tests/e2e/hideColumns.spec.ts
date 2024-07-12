import { test, expect } from '../../src/test-runner';

import {
  columnsCount,
  selectColumnHeaderByNameAndOpenMenu,

} from '../../src/page-helpers';

test(__filename, async({ tablePage }) => {
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
});
