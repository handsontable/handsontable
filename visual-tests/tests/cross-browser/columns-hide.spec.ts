import path from 'path';
import { helpers } from '../../src/helpers';
import { testCrossBrowser, expect } from '../../src/test-runner';

import {
  columnsCount,
  selectColumnHeaderByNameAndOpenMenu,

} from '../../src/page-helpers';

const url = '/';

testCrossBrowser(__filename, async({ tablePage }) => {
  await tablePage.goto(url);

  expect(await columnsCount()).toBe(9);

  await selectColumnHeaderByNameAndOpenMenu('Name');
  await tablePage.getByText('Hide column').click();
  expect(await columnsCount()).toBe(8);

  await selectColumnHeaderByNameAndOpenMenu('In stock');
  await tablePage.getByText('Hide column').click();
  expect(await columnsCount()).toBe(7);

  const testFileName = path.basename(__filename, '.spec.ts');

  await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, url, '-columns_hidden') });

  await tablePage.getByRole('columnheader', { name: 'Company name' }).click();
  await tablePage.getByRole('columnheader', { name: 'Progress' }).click({ modifiers: ['Shift'] });

  await selectColumnHeaderByNameAndOpenMenu('Progress');

  await tablePage.getByText('Show columns').click();
  expect(await columnsCount()).toBe(9);
  await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, url, '-columns_visible') });

});
