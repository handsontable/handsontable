import { helpers } from '../../src/helpers';
import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  openHeaderDropdownMenu,
  filterByValue,
  setColumnSorting,
  SortDirection,
} from '../../src/page-helpers';

/**
 * Checks that the pagination bar — the native page-size select, the counter and the page buttons —
 * renders in Chromium, Firefox and WebKit over a filtered and sorted grid. One capture in each browser,
 * after asserting the sort and the counter. Paging through that grid, and a column cleared on one page
 * (this spec's three retired captures), are asserted on all six theme and bundle legs by
 * `tests/e2e/pagination-filter-sort.spec.ts`; the pages themselves are photographed on every theme by
 * `js-only/pagination`. Owned by DEV-3257.
 */
visualTest('Test pagination', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/pagination-demo');

  // filtering
  await openHeaderDropdownMenu('Country');
  await filterByValue('In');

  // sorting
  await setColumnSorting('Company name', SortDirection.Ascending);

  await expect(tablePage.getByRole('columnheader', { name: 'Company name' }))
    .toHaveAttribute('aria-sort', SortDirection.Ascending);
  await expect(tablePage.locator('.ht-page-counter-section')).toHaveText('1 - 10 of 59');
  await expect(tablePage.locator('.ht-page-navigation-section__label')).toHaveText('Page 1 of 6');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
