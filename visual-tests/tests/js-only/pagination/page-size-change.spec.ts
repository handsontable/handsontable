import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  forPaginationClickLastPageButton,
  forPaginationChangePageSize,
} from '../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/pagination-demo')
      .getFullUrl()
  );

  await forPaginationChangePageSize('10');

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationClickLastPageButton();
  await forPaginationChangePageSize('50');

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await forPaginationChangePageSize('20');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
