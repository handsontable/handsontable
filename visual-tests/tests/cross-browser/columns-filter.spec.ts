import { test, expect } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import {
  rowsCount,
  openHeaderDropdownMenu,
  filterByValue,
  FilterConditions,
  filterByCondition,
} from '../../src/page-helpers';

test('Test filtering', async({ tablePage }) => {
  expect(await rowsCount()).toBe(22);

  await openHeaderDropdownMenu(9);
  await filterByValue('India');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  expect(await rowsCount()).toBe(6);

  await openHeaderDropdownMenu(3);
  await filterByCondition(FilterConditions.IsBetween, '01/01/2020', '30/06/2020');

  expect(await rowsCount()).toBe(3);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
