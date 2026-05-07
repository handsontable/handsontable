import { test, expect } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import {
  rowsCount,
  openHeaderDropdownMenu,
  filterByValue,
} from '../../src/page-helpers';

test('Test filtering', async({ tablePage }) => {
  expect(await rowsCount()).toBe(16);

  await openHeaderDropdownMenu('Country');
  await filterByValue('India');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  expect(await rowsCount()).toBe(6);
});
