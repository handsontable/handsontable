import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  forPaginationClickNextPageButton,
  forPaginationClickPrevPageButton,
  forPaginationClickLastPageButton,
  openHeaderDropdownMenu,
  filterByCondition,
  setColumnSorting,
  SortDirection,
  FilterConditions,
} from '../../../src/page-helpers';

/**
 * Checks that `pageSize: 'auto'` fits each page to the viewport when the grid has no size of its own: after
 * filtering and sorting, while paging forward, after the viewport shrinks to 300 px, while paging back, and
 * on the last page. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/pagination-demo')
      .setPageParams({
        pageSize: 'auto',
        ignoreTableSize: true,
        hideInputs: true,
      })
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

  await tablePage.setViewportSize({
    width: 1280,
    height: 300,
  });

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 3

  await forPaginationClickPrevPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 2

  await forPaginationClickPrevPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the page 1

  await forPaginationClickLastPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() }); // screenshot of the last page
});
