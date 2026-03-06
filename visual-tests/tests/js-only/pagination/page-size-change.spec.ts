import { test } from '../../../src/test-runner';
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

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
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
