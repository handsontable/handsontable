import { helpers } from '../../src/helpers';
import { test, expect } from '../../src/test-runner';
import {
  columnsCount,
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu,
} from '../../src/page-helpers';

test('Test column hiding', async({ tablePage }) => {
  expect(await columnsCount()).toBe(9);

  await selectColumnHeaderByNameAndOpenMenu('Name');
  await selectFromContextMenu('"Hide column"');

  expect(await columnsCount()).toBe(8);

  await selectColumnHeaderByNameAndOpenMenu('In stock');
  await selectFromContextMenu('"Hide column"');

  expect(await columnsCount()).toBe(7);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
  await tablePage.getByRole('columnheader', { name: 'Company name' }).click();
  await tablePage.getByRole('columnheader', { name: 'Progress' }).click({ modifiers: ['Shift'] });

  await selectColumnHeaderByNameAndOpenMenu('Progress');

  await selectFromContextMenu('"Show columns"');

  expect(await columnsCount()).toBe(9);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
