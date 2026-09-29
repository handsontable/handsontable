import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import {
  rowsCount,
  openHeaderDropdownMenu,
  filterByValue,
  FilterConditions,
  filterByCondition,
} from '../../src/page-helpers';

/**
 * Checks that filtering by value (Country: India) and then by condition (Sell date between two dates)
 * renders the filtered rows and the header indicators. The row counts are asserted; the two captures show
 * what the filters look like. Owned by DEV-2981.
 */
visualTest('Test filtering', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  expect(await rowsCount()).toBe(16);

  await openHeaderDropdownMenu('Country');
  await filterByValue('India');
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  expect(await rowsCount()).toBe(6);

  await openHeaderDropdownMenu('Sell date');
  await filterByCondition(FilterConditions.IsBetween, '2020-01-01', '2020-06-30');

  expect(await rowsCount()).toBe(3);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
