import { visualTest, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  forPaginationClickFirstPageButton,
  forPaginationClickPrevPageButton,
  forPaginationClickNextPageButton,
  forPaginationClickLastPageButton,
} from '../../../src/page-helpers';

/**
 * Checks that the last, first, next, and previous page buttons move the page and update the pagination
 * controls: one capture after Last, after First, after two Nexts, and after Previous. Owned by DEV-2981.
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

  await forPaginationClickLastPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickFirstPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickNextPageButton();
  await forPaginationClickNextPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickPrevPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
