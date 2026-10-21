import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import {
  rowsCount,
  openHeaderDropdownMenu,
  filterByValue,
} from '../../src/page-helpers';

/**
 * Checks that filtering by value (Country: India) renders the filtered rows and the active-filter
 * indicator on the header in Chromium, Firefox and WebKit. One capture in each browser, after
 * asserting the row count, that the menu closed, and that Country alone carries the indicator. Which
 * rows a value search keeps, and a second column's date range on top of it (this spec's retired second
 * capture, a WebKit flake), are asserted on all six theme and bundle legs and on Firefox and WebKit by
 * `tests/e2e/filters-search-then-condition.spec.ts`. Owned by DEV-3257.
 */
visualTest('Test filtering', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  expect(await rowsCount()).toBe(16);

  await openHeaderDropdownMenu('Country');
  await filterByValue('India');

  await expect(tablePage.locator(helpers.selectors.dropdownMenu)).toBeHidden();
  await expect(tablePage.locator('.ht_clone_top th.htFiltersActive')).toHaveText(['Country']);
  expect(await rowsCount()).toBe(6);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
