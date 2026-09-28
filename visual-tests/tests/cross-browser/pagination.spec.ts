import { helpers } from '../../src/helpers';
import { visualTest, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectColumnHeaderByIndex,
  openHeaderDropdownMenu,
  filterByValue,
  setColumnSorting,
  SortDirection,
  forPaginationClickNextPageButton,
  forPaginationClickPrevPageButton,
} from '../../src/page-helpers';

/**
 * Checks that the pagination controls and page counts stay right after filtering and sorting, after moving
 * to the next page, after clearing a column, and after moving back. Owned by DEV-2981.
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

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickNextPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await selectColumnHeaderByIndex(1);
  await tablePage.keyboard.press('Delete');
  await forPaginationClickNextPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickPrevPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
