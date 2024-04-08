import { test, expect } from '../../src/test-runner';

import {
  rowsCount,
  openHeaderDropdownMenu,
  filterByValue,
  takeScreenshot,
  FilterConditions,
  filterByCondition,
} from '../../src/page-helpers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test(__filename, async({ tablePage }) => {
  expect(await rowsCount()).toBe(22);
  await openHeaderDropdownMenu(9);
  await filterByValue('India');
  await takeScreenshot();
  expect(await rowsCount()).toBe(6);

  await openHeaderDropdownMenu(3);
  await filterByCondition(FilterConditions.IsBetween, '01/01/2020', '30/06/2020');

  expect(await rowsCount()).toBe(3);

});
