import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import PageHolder from '../../../src/page-holder';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/iframe-demo')
      .getFullUrl()
  );

  const page = PageHolder.getInstance().getPage();
  const tableLocator = page.frameLocator('iFrame').locator(helpers.selectors.anyTableIframe).first();
  const tbody = tableLocator.locator(helpers.selectors.mainTableBody);

  const cell = await tbody.locator(helpers.findCell({ row: 0, column: 0, cellType: 'td' }));

  await cell.click();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
