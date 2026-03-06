import { helpers } from '../../src/helpers';
import { test } from '../../src/test-runner';
import {
  selectColumnHeaderByIndex,
  openHeaderDropdownMenu,
  filterByValue,
  setColumnSorting,
  SortDirection,
  forPaginationClickNextPageButton,
  forPaginationClickPrevPageButton,
} from '../../src/page-helpers';

test('Test pagination', async({ goto, tablePage }) => {
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
