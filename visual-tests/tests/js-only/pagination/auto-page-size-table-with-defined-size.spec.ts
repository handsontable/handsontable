import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  forHandsontableUpdateSettings,
  forPaginationClickNextPageButton,
  forPaginationClickPrevPageButton,
  forPaginationClickLastPageButton,
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
      .setPageParams({ pageSize: 'auto' })
      .getFullUrl()
  );

  // filtering
  await openHeaderDropdownMenu('Company name');
  await filterByCondition(FilterConditions.Contains, 'a');

  // sorting
  await setColumnSorting('Country', SortDirection.Ascending);

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 1

  await forPaginationClickNextPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 2

  await forPaginationClickNextPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 3

  await forPaginationClickNextPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 4

  await forHandsontableUpdateSettings({
    height: 300,
  });

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 4

  await forPaginationClickPrevPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 3

  await forPaginationClickPrevPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 2

  await forPaginationClickPrevPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 1

  await forPaginationClickLastPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the last page
});
