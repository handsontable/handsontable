import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

/**
 * Checks if active class is applied on the filtered column header with nested headers.
 */
test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/empty-data-state-demo')
      .setPageParams({ height: 'auto', noColumns: true })
      .getFullUrl()
  );

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
