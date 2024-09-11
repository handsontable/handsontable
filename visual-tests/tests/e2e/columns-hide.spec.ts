import { testE2E, expect } from '../../src/test-runner';

import {
  columnsCount,
  selectColumnHeaderByNameAndOpenMenu,

} from '../../src/page-helpers';

const url = '/';

testE2E(__filename, async({ tablePage }) => {
  await tablePage.goto(url);

  expect(await columnsCount()).toBe(9);

  await selectColumnHeaderByNameAndOpenMenu('Name');
  await tablePage.getByText('Hide column').click();
  expect(await columnsCount()).toBe(8);

  await selectColumnHeaderByNameAndOpenMenu('In stock');
  await tablePage.getByText('Hide column').click();
  expect(await columnsCount()).toBe(7);

  await tablePage.getByRole('columnheader', { name: 'Company name' }).click();
  await tablePage.getByRole('columnheader', { name: 'Progress' }).click({modifiers: ['Shift']});

  await selectColumnHeaderByNameAndOpenMenu('Progress');

  await tablePage.getByText('Show columns').click();
  expect(await columnsCount()).toBe(9);
});
