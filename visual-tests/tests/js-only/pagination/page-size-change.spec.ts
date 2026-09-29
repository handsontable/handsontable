import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  forPaginationClickLastPageButton,
  forPaginationClickNextPageButton,
  forPaginationChangePageSize,
  openHeaderDropdownMenu,
  filterByCondition,
  setColumnSorting,
  SortDirection,
  FilterConditions,
} from '../../../src/page-helpers';

/**
 * Checks that changing the page size (50, auto, then 20) re-pages a filtered and sorted grid and updates
 * the controls, including after a move to the next page. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/pagination-demo')
      .getFullUrl()
  );

  // filtering
  await openHeaderDropdownMenu('Company name');
  await filterByCondition(FilterConditions.Contains, 'a');

  // sorting
  await setColumnSorting('Country', SortDirection.Ascending);

  await forPaginationClickLastPageButton();
  await forPaginationChangePageSize('50');

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationChangePageSize('auto');

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickNextPageButton();
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationChangePageSize('20');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
