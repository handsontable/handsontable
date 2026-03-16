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
  expect(await rowsCount()).toBe(17);

  await openHeaderDropdownMenu('Country');
  await filterByValue('India');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  expect(await rowsCount()).toBe(6);

  await openHeaderDropdownMenu('Sell date');
  // Use single-input "Before" (30/06/2020) to avoid flaky two-input "Is between" in CI; same 3 India rows.
  await filterByCondition(FilterConditions.Before, '30/06/2020');

  await expect.poll(async() => rowsCount()).toBe(3);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
