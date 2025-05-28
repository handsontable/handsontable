import { test } from '../../../../src/test-runner';
import { helpers } from '../../../../src/helpers';
import {
  forPaginationClickFirstPageButton,
  forPaginationClickPrevPageButton,
  forPaginationClickNextPageButton,
  forPaginationClickLastPageButton,
} from '../../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/pagination-demo')
      .setPageParams({ direction: 'rtl' })
      .getFullUrl()
  );

  await forPaginationClickLastPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickFirstPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickNextPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickPrevPageButton();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
